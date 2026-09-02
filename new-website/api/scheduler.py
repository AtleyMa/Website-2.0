# Daily exchange summary scheduler
import logging
import os
from datetime import datetime

import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from constants import SCREW_IN, QUICK_CONNECT
from database import Database
from services.sms import sms_service

logger = logging.getLogger(__name__)

# Calgary local timezone (MST/MDT) and the admin recipient
CALGARY_TZ = pytz.timezone('America/Edmonton')

# Short connection-type labels used in the summary
TYPE_SHORT = {
    SCREW_IN: 'screw-in',
    QUICK_CONNECT: 'quick-connect',
}

_scheduler = None


def _calgary_now():
    return datetime.now(CALGARY_TZ)


def _plural(count, word):
    return f"{count} {word}{'' if count == 1 else 's'}"


def build_daily_summary(date_str, display_date):
    """Build the daily summary message from today's exchanges."""
    rows = Database.execute_query(
        """
        SELECT e.customer_id, e.num_cans, e.can_type, c.f_name, c.l_name
        FROM exchanges e
        LEFT JOIN customers c ON e.customer_id = c.customer_id
        WHERE e.date = %s
        ORDER BY e.customer_id, e.exchange_id
        """,
        (date_str,),
    )

    header = f"SodaKid Daily Summary - {display_date}"

    if not rows:
        return f"{header}\n\nNo exchanges scheduled today."

    # Aggregate quantities per customer (keyed by customer_id) and per type
    customers = []
    type_totals = {}
    index = {}

    for row in rows:
        customer_id = row['customer_id']
        can_type = row['can_type']
        qty = int(row['num_cans'] or 0)

        if customer_id not in index:
            name = f"{row['f_name'] or ''} {row['l_name'] or ''}".strip() or 'Unknown'
            index[customer_id] = len(customers)
            customers.append({'name': name, 'items': {}})

        items = customers[index[customer_id]]['items']
        items[can_type] = items.get(can_type, 0) + qty
        type_totals[can_type] = type_totals.get(can_type, 0) + qty

    total_cylinders = sum(type_totals.values())

    lines = [
        header,
        '',
        f"{_plural(len(rows), 'exchange')} | {_plural(total_cylinders, 'cylinder')}",
        '',
    ]

    for i, customer in enumerate(customers, start=1):
        detail = ', '.join(f"{ct} x{qty}" for ct, qty in customer['items'].items())
        lines.append(f"{i}. {customer['name']} - {detail}")

    prep = [f"{type_totals[ct]} {TYPE_SHORT[ct]}" for ct in (SCREW_IN, QUICK_CONNECT) if type_totals.get(ct)]
    if prep:
        lines.append('')
        lines.append('Prep: ' + ', '.join(prep))

    return '\n'.join(lines)


def send_daily_summary():
    """Send today's exchange summary to the admin phone."""
    now = _calgary_now()
    date_str = f"{now.month}_{now.day}_{now.year}"
    display_date = now.strftime('%a %b ') + str(now.day)
    admin_phone = os.getenv('ADMIN_SUMMARY_PHONE', '4038631100')

    try:
        message = build_daily_summary(date_str, display_date)
        sms_service.send_sms(admin_phone, message, sms_type='Promotional')
        logger.info("Daily summary sent for %s", display_date)
    except Exception:
        logger.exception("Failed to generate daily summary")
        sms_service.send_sms(admin_phone, "SodaKid Daily Summary failed to generate. Please check the server.", sms_type='Promotional')


def send_reorder_nudges():
    """Send a reorder nudge to customers whose most recent exchange happened a
    month per canister ago. Rule: if a customer last exchanged N canisters,
    nudge once after ~N months (30 days per canister) with a small grace so
    they can reorder before running out."""
    from datetime import timedelta

    now = _calgary_now()
    # One month per canister, minus a 3-day grace so the SMS lands while they
    # can still reorder in time. Row 1 per customer = most recent pickup date.
    rows = Database.execute_query(
        """SELECT e.exchange_id, e.customer_id, e.date, e.num_cans,
                  c.f_name, c.l_name, c.phone
           FROM exchanges e
           LEFT JOIN customers c ON e.customer_id = c.customer_id
           JOIN (
                SELECT customer_id, MAX(STR_TO_DATE(date, '%c_%e_%Y')) AS max_date
                FROM exchanges
                WHERE status = 'picked_up'
                GROUP BY customer_id
           ) latest ON latest.customer_id = e.customer_id
                AND STR_TO_DATE(e.date, '%c_%e_%Y') = latest.max_date
           WHERE e.status = 'picked_up'
             AND e.nudge_sent_at IS NULL
           ORDER BY e.customer_id"""
    )

    sent = 0
    for row in rows:
        phone = row.get('phone')
        num_cans = int(row.get('num_cans') or 0)
        if not phone or num_cans <= 0:
            continue

        parts = (row['date'] or '').split('_')
        if len(parts) != 3:
            continue
        from datetime import datetime
        try:
            last_exchange = datetime(int(parts[2]), int(parts[0]), int(parts[1]))
        except ValueError:
            continue

        nudge_at = last_exchange + timedelta(days=num_cans * 30 - 3)
        if now.date() < nudge_at.date():
            continue  # not yet due

        first = row.get('f_name') or ''
        msg = (
            f"SodaKid: hi {first.strip()}! It's been about a month per cylinder since your "
            f"last exchange of {num_cans} cylinder{'s' if num_cans != 1 else ''}. "
            f"Ready for a refill? Order at https://sodakid.ca/place-order"
        )
        sms_service.send_sms(phone, msg, sms_type='Transactional')
        Database.execute_update(
            "UPDATE exchanges SET nudge_sent_at = %s WHERE exchange_id = %s",
            (now, row['exchange_id'])
        )
        sent += 1

    logger.info("Reorder nudges sent: %d", sent)


def init_scheduler():
    """Start the background scheduler (idempotent)."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        send_daily_summary,
        CronTrigger(hour=22, minute=0, timezone=CALGARY_TZ),
        id='daily_summary',
        name='Send daily exchange summary',
        replace_existing=True,
        misfire_grace_time=3600,
    )
    _scheduler.add_job(
        send_reorder_nudges,
        CronTrigger(hour=10, minute=0, timezone=CALGARY_TZ),
        id='reorder_nudges',
        name='Send reorder nudges',
        replace_existing=True,
        misfire_grace_time=3600,
    )
    _scheduler.start()
    logger.info("Daily summary scheduler started (22:00 America/Edmonton)")
    logger.info("Reorder nudge scheduler started (10:00 America/Edmonton)")
    return _scheduler
