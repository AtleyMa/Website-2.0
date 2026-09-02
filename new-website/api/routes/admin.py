# Admin Routes - Secure dashboard endpoints
import hmac
import logging
import os
import secrets
from datetime import datetime

from dotenv import load_dotenv
from flask import Blueprint, request, jsonify

import pytz
from database import Database

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.env'))

admin_bp = Blueprint('admin', __name__)

# Simple token storage (in production, use Redis or database)
admin_tokens = set()

# Admin password from environment variable
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'SodaKid2024!')


def verify_admin_token(token):
    """Verify the admin token is valid"""
    return token in admin_tokens


def require_admin(f):
    """Decorator to require admin authentication"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-Admin-Token')
        if not token or not verify_admin_token(token):
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    data = request.get_json(silent=True) or {}
    password = data.get('password', '')
    
    if hmac.compare_digest(password, ADMIN_PASSWORD):
        # Generate a secure token
        token = secrets.token_urlsafe(32)
        admin_tokens.add(token)
        return jsonify({
            'success': True,
            'token': token,
            'message': 'Login successful'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Invalid password'
        }), 401


@admin_bp.route('/logout', methods=['POST'])
@require_admin
def admin_logout():
    """Admin logout endpoint"""
    token = request.headers.get('X-Admin-Token')
    admin_tokens.discard(token)
    return jsonify({'message': 'Logged out successfully'}), 200


@admin_bp.route('/customers', methods=['GET'])
@require_admin
def get_customers():
    """Get all customers"""
    try:
        customers = Database.execute_query(
            """SELECT customer_id, f_name, l_name, phone, email, stripe_id 
               FROM customers 
               ORDER BY customer_id DESC"""
        )
        return jsonify({'customers': customers or []}), 200
    except Exception as e:
        logger.exception("Error fetching customers")
        return jsonify({'customers': [], 'error': str(e)}), 200


@admin_bp.route('/exchanges', methods=['GET'])
@require_admin
def get_exchanges():
    """Get all exchanges/orders"""
    try:
        exchanges = Database.execute_query(
            """SELECT e.exchange_id, e.customer_id, e.time, e.date,
                      e.num_cans, e.can_type, COALESCE(e.status, 'scheduled') as status,
                      c.f_name, c.l_name, c.phone,
                      p.payment_id, p.datetime as paid_at,
                      p.stripe_payment_intent_id, p.amount_paid,
                      COALESCE(p.status, 'none') as payment_status
               FROM exchanges e
               LEFT JOIN customers c ON e.customer_id = c.customer_id
               LEFT JOIN payments p ON e.exchange_id = p.exchange_id
               ORDER BY e.exchange_id DESC"""
        )
        return jsonify({'exchanges': exchanges or []}), 200
    except Exception as e:
        logger.exception("Error fetching exchanges")
        return jsonify({'exchanges': [], 'error': str(e)}), 200


@admin_bp.route('/exchanges/<int:exchange_id>/status', methods=['PUT'])
@require_admin
def update_exchange_status(exchange_id):
    """Advance an exchange's fulfillment status"""
    data = request.get_json(silent=True) or {}
    status = data.get('status')
    valid_statuses = ['scheduled', 'ready', 'picked_up']
    if status not in valid_statuses:
        return jsonify({'message': f'Invalid status. Must be one of {valid_statuses}'}), 400

    try:
        updated = Database.execute_update(
            "UPDATE exchanges SET status = %s WHERE exchange_id = %s",
            (status, exchange_id)
        )
        if not updated:
            return jsonify({'message': 'Exchange not found'}), 404

        # Optional one-click SMS to the customer on ready/picked_up
        if status in ('ready', 'picked_up') and data.get('notify'):
            exchange = Database.execute_query(
                """SELECT e.date, e.can_type, c.phone
                   FROM exchanges e
                   LEFT JOIN customers c ON e.customer_id = c.customer_id
                   WHERE e.exchange_id = %s""",
                (exchange_id,),
                fetch_one=True
            )
            if exchange and exchange.get('phone'):
                from services.sms import sms_service
                order_date = (exchange['date'] or '').replace('_', '/')
                if status == 'ready':
                    msg = (f"SodaKid Update: Your exchange is ready for pickup on {order_date}. "
                           f"Please arrive at 2005 29 Ave SW Calgary. Thank you!")
                else:
                    msg = (f"SodaKid: Thanks for your exchange on {order_date}. "
                           f"Have a great day!")
                sms_service.send_sms(exchange['phone'], msg)

        return jsonify({'message': f'Status updated to {status}', 'exchangeId': exchange_id}), 200
    except Exception as e:
        logger.exception("Error updating exchange status")
        return jsonify({'message': 'Failed to update exchange status', 'error': str(e)}), 500


@admin_bp.route('/exchanges/<int:exchange_id>/refund', methods=['POST'])
@require_admin
def refund_exchange(exchange_id):
    """Refund a paid exchange via Stripe, then mark it refunded."""
    try:
        payment = Database.execute_query(
            """SELECT payment_id, stripe_payment_intent_id, status
               FROM payments
               WHERE exchange_id = %s
               ORDER BY payment_id DESC LIMIT 1""",
            (str(exchange_id),),
            fetch_one=True
        )

        if not payment or not payment.get('stripe_payment_intent_id'):
            return jsonify({'message': 'No Stripe payment found for this exchange'}), 400
        if payment['status'] == 'refunded':
            return jsonify({'message': 'Exchange is already refunded'}), 400

        from services.stripe_service import stripe_service
        stripe_service.create_refund(payment['stripe_payment_intent_id'])

        Database.execute_update(
            "UPDATE payments SET status = 'refunded', refunded_at = NOW() WHERE payment_id = %s",
            (payment['payment_id'],)
        )

        return jsonify({'message': 'Refund processed', 'exchangeId': exchange_id}), 200
    except Exception as e:
        logger.exception("Error refunding exchange %s", exchange_id)
        return jsonify({'message': 'Refund failed', 'error': str(e)}), 500


@admin_bp.route('/today', methods=['GET'])
@require_admin
def get_today():
    """Get today's exchanges (pickup list)"""
    try:
        now = datetime.now(pytz.timezone('America/Edmonton'))
        date_str = f"{now.month}_{now.day}_{now.year}"
        exchanges = Database.execute_query(
            """SELECT e.exchange_id, e.customer_id, e.time, e.date,
                      e.num_cans, e.can_type, COALESCE(e.status, 'scheduled') as status,
                      c.f_name, c.l_name, c.phone,
                      p.amount_paid, COALESCE(p.status, 'none') as payment_status
               FROM exchanges e
               LEFT JOIN customers c ON e.customer_id = c.customer_id
               LEFT JOIN payments p ON e.exchange_id = p.exchange_id
               WHERE e.date = %s
               ORDER BY e.exchange_id""",
            (date_str,)
        )
        return jsonify({'date': date_str, 'exchanges': exchanges or []}), 200
    except Exception as e:
        logger.exception("Error fetching today's exchanges")
        return jsonify({'date': None, 'exchanges': [], 'error': str(e)}), 200


@admin_bp.route('/revenue', methods=['GET'])
@require_admin
def get_revenue():
    """Revenue breakdown by month and cylinder type"""
    try:
        # Revenue from actual Stripe payments (cents). Rows with a payment
        # record on the exchange are summed by amount_paid; legacy exchanges
        # without a payment row fall back to the assumed $10/cylinder.
        by_month = Database.execute_query(
            """SELECT DATE_FORMAT(STR_TO_DATE(e.date, '%c_%e_%Y'), '%Y-%m') as ym,
                      SUM(COALESCE(p.amount_paid, e.num_cans * 1000)) / 100 as revenue,
                      COUNT(*) as exchange_count
               FROM exchanges e
               LEFT JOIN payments p ON e.exchange_id = p.exchange_id
               GROUP BY ym
               ORDER BY ym DESC
               LIMIT 24"""
        )
        by_type = Database.execute_query(
            """SELECT e.can_type,
                      SUM(COALESCE(p.amount_paid, e.num_cans * 1000)) / 100 as revenue,
                      COUNT(*) as exchange_count
               FROM exchanges e
               LEFT JOIN payments p ON e.exchange_id = p.exchange_id
               GROUP BY e.can_type"""
        )
        return jsonify({
            'byMonth': by_month or [],
            'byType': by_type or []
        }), 200
    except Exception as e:
        logger.exception("Error fetching revenue")
        return jsonify({'byMonth': [], 'byType': [], 'error': str(e)}), 200


@admin_bp.route('/export/<table>', methods=['GET'])
@require_admin
def export_csv(table):
    """Export a table as CSV (customers or exchanges)."""
    import csv
    import io

    if table not in ('customers', 'exchanges'):
        return jsonify({'message': 'Unknown export table'}), 400

    try:
        if table == 'customers':
            rows = Database.execute_query(
                """SELECT customer_id, f_name, l_name, phone, email, stripe_id, created_at
                   FROM customers ORDER BY customer_id"""
            )
            fieldnames = ['customer_id', 'f_name', 'l_name', 'phone', 'email', 'stripe_id', 'created_at']
        else:
            rows = Database.execute_query(
                """SELECT e.exchange_id, e.customer_id, e.date, e.time,
                          e.num_cans, e.can_type, COALESCE(e.status, 'scheduled') as status,
                          e.datetime as created_at, c.f_name, c.l_name, c.phone
                   FROM exchanges e
                   LEFT JOIN customers c ON e.customer_id = c.customer_id
                   ORDER BY e.exchange_id"""
            )
            fieldnames = ['exchange_id', 'customer_id', 'date', 'time', 'num_cans',
                          'can_type', 'status', 'created_at', 'f_name', 'l_name', 'phone']

        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for row in rows or []:
            writer.writerow({fn: row.get(fn, '') if str(row.get(fn, '')) else '' for fn in fieldnames})

        from flask import Response
        return Response(
            buf.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={table}.csv'}
        ), 200
    except Exception as e:
        logger.exception("Error exporting %s", table)
        return jsonify({'message': 'Export failed', 'error': str(e)}), 500


@admin_bp.route('/messages', methods=['GET'])
@require_admin
def get_messages():
    """Get all contact messages"""
    try:
        messages = Database.execute_query(
            """SELECT message_id, f_name, l_name, phone, message 
               FROM messages 
               ORDER BY message_id DESC"""
        )
        return jsonify({'messages': messages or []}), 200
    except Exception as e:
        logger.exception("Error fetching messages")
        return jsonify({'messages': [], 'error': str(e)}), 200


@admin_bp.route('/sent-messages', methods=['GET'])
@require_admin
def get_sent_messages():
    """Get all sent SMS messages"""
    try:
        sent = Database.execute_query(
            """SELECT message_sent_id, message_content, phone 
               FROM message_sent 
               ORDER BY message_sent_id DESC"""
        )
        return jsonify({'sentMessages': sent or []}), 200
    except Exception as e:
        logger.exception("Error fetching sent messages")
        return jsonify({'sentMessages': [], 'error': str(e)}), 200


@admin_bp.route('/stats', methods=['GET'])
@require_admin
def get_stats():
    """Get dashboard statistics"""
    try:
        # Total customers
        customer_count = Database.execute_query(
            "SELECT COUNT(*) as count FROM customers",
            fetch_one=True
        )

        # Total exchanges
        exchange_count = Database.execute_query(
            "SELECT COUNT(*) as count FROM exchanges",
            fetch_one=True
        )

        # Total revenue from actual Stripe payments (cents), falling back to
        # assumed $10/cylinder for legacy exchanges without a payment row.
        revenue = Database.execute_query(
            """SELECT COALESCE(SUM(COALESCE(p.amount_paid, e.num_cans * 1000)), 0) / 100 as total
               FROM exchanges e
               LEFT JOIN payments p ON e.exchange_id = p.exchange_id""",
            fetch_one=True
        )

        # Exchanges whose scheduled day is today or still in the future.
        # The `date` column stores M_D_YYYY (no zero-padding), so convert it
        # to a real date for a correct comparison against CURDATE().
        pending = Database.execute_query(
            """SELECT COUNT(*) as count FROM exchanges
               WHERE STR_TO_DATE(date, '%c_%e_%Y') >= CURDATE()""",
            fetch_one=True
        )

        # Exchanges completed (picked up) today
        picked_up_today = Database.execute_query(
            """SELECT COUNT(*) as count FROM exchanges
               WHERE status = 'picked_up'
                 AND DATE(datetime) = CURDATE()""",
            fetch_one=True
        )

        return jsonify({
            'totalCustomers': customer_count['count'] if customer_count else 0,
            'totalExchanges': exchange_count['count'] if exchange_count else 0,
            'totalRevenue': revenue['total'] if revenue else 0,
            'pendingExchanges': pending['count'] if pending else 0,
            'pickedUpToday': picked_up_today['count'] if picked_up_today else 0
        }), 200
    except Exception as e:
        logger.exception("Error fetching stats")
        return jsonify({
            'totalCustomers': 0,
            'totalExchanges': 0,
            'totalRevenue': 0,
            'pendingExchanges': 0,
            'pickedUpToday': 0,
            'error': str(e)
        }), 200


@admin_bp.route('/scheduler', methods=['GET'])
@require_admin
def get_scheduler_status():
    """Report the running state of the background scheduler and its jobs."""
    try:
        from scheduler import _scheduler
        if _scheduler is None:
            return jsonify({'scheduler': 'not_started', 'jobs': []}), 200
        jobs = []
        for job in _scheduler.get_jobs():
            jobs.append({
                'id': job.id,
                'name': job.name,
                'nextRun': str(job.next_run_time) if job.next_run_time else None,
            })
        return jsonify({'scheduler': 'running', 'jobs': jobs}), 200
    except Exception as e:
        logger.exception("Error checking scheduler status")
        return jsonify({'scheduler': 'error', 'jobs': [], 'error': str(e)}), 200
