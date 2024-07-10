# SodaKid Website
'''
TODO:
    - Background Colour: #f8f9fa
'''

from __future__ import division
from flask import Flask, render_template, request, redirect, session, render_template_string, send_from_directory, make_response
from flask_bootstrap import Bootstrap
from flask_session import Session
#from flask_debugtoolbar import DebugToolbarExtension
from datetime import date, datetime
import calendar
import stripe
import boto3
import mariadb
import random
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path='config.env')

#AWS Clients
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
region = os.getenv('AWS_REGION')
sns = boto3.client('sns', aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key, region_name=region)

# MariaDB connection parameters
conn_params= {
    "user" : os.getenv('DB_USER'),
    "password" : os.getenv('DB_PASSWORD'),
    "host" : os.getenv('DB_HOST'),
    "database" : os.getenv('DB_NAME')
}

# Establish a db connection
connection= mariadb.connect(**conn_params)
c = connection.cursor()

test_sk = os.getenv('STRIPE_TEST_SECRET_KEY')
real_sk = os.getenv('STRIPE_SECRET_KEY')

stripe.api_key = real_sk

app = Flask(__name__, static_folder="static")

app.config['WTF_CSRF_ENABLED'] = False
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['DEBUG_TB_PROFILER_ENABLED'] = True
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
#toolbar = DebugToolbarExtension(app)
b = Bootstrap(app)
Session(app)

def sent_messages(message, phone):
    # Establish a db connection
    connection= mariadb.connect(**conn_params)
    c = connection.cursor()
    data = (message, phone)
    c.execute("INSERT INTO message_sent (message_content, phone) VALUES (%s, %s)", data)
    connection.commit()
    c.close()
    connection.close()
    return "Database updated"

# Certbot HTTPS Certificate Directory
@app.route('/.well-known/acme-challenge/<path:filename>')
def serve_challenge(filename):
    print("certbot")
    return send_from_directory(r"C:\inetpub\wwwroot\.well-known\acme-challenge", filename)

# Dev Login Page
@app.route("/dev-login", methods=["GET", "POST"])
def devLogin():
    session['referrer'] = ""
    return render_template("Dev-Login.html")

# Dev Login Form
@app.route("/dev-login-form", methods=["POST"])
def devLoginForm():
    bad_dev_login = False
    password = request.form.get("pass")
    if (password == "Chewie325!"):
        # Establish a db connection
        connection= mariadb.connect(**conn_params)
        c = connection.cursor()
        c.execute("SELECT * FROM customers")
        customers = c.fetchall()
        c.execute("SELECT * FROM exchanges")
        exchanges = c.fetchall()
        c.execute("SELECT * FROM messages")
        messages = c.fetchall()
        c.execute("SELECT * FROM message_sent")
        sent_messages = c.fetchall()
        c.execute("SELECT * FROM payments")
        payments = c.fetchall()
        c.execute("SELECT * FROM app_visited")
        app_visited = c.fetchall()
        c.close()
        connection.close()
        return render_template("Dev.html", customers=customers, exchanges=exchanges, messages=messages, sent_messages=sent_messages, payments=payments, app_visited=app_visited)
    bad_dev_login = True
    return render_template("Dev-Login.html", badDevLogin=bad_dev_login)

# Homepage
@app.route("/", methods=["GET", "POST"])
def main():
    session['logged_in_alert'] = False
    session['signed_up_alert'] = False
    session['logged_out_alert'] = False
    session['pass_reset_alert'] = False
    logged_in_alert = session.get('logged_in_alert')
    signed_up_alert = session.get('signed_up_alert')
    logged_out_alert = session.get('logged_out_alert')
    pass_reset_alert = session.get('pass_reset_alert')
    referrer = session.get('referrer')
    if referrer != "homepage":
        if referrer and 'login-form' == referrer:
            logged_in_alert = True
            logged_out_alert = False
        elif referrer and 'sign-up-form' in referrer:
            signed_up_alert = True
            logged_out_alert = False
        elif referrer and 'logged-out' in referrer:
            logged_out_alert = True
            logged_in_alert = False
            signed_up_alert = False
        elif referrer and 'pass-reset' in referrer:
            pass_reset_alert = True
    session['referrer'] = "homepage"
    return render_template("Homepage.html", loggedInAlert=logged_in_alert, signedUpAlert=signed_up_alert, loggedOutAlert=logged_out_alert, passResetAlert=pass_reset_alert, loggedIn=session.get('logged_in'), f_name=session.get('f_name'), l_name=session.get('l_name'))

# About Page
@app.route("/about", methods=["GET", "POST"])
def about():
    session['referrer'] = ""
    f_name = session.get('f_name')
    l_name = session.get('l_name')
    logged_in = session.get('logged_in')
    return render_template("About.html", loggedIn=logged_in, f_name=f_name, l_name=l_name)

# Contact me page
@app.route("/contact", methods=["GET", "POST"])
def contact():
    session['referrer'] = ""
    f_name = session.get('f_name')
    l_name = session.get('l_name')
    logged_in = session.get('logged_in')
    return render_template("Contact.html", loggedIn=logged_in, f_name=f_name, l_name=l_name)

# Contact me form
@app.route("/contact-submitted", methods=["POST"])
def contact_submitted():
    global c
    global connection
    global conn_params
    f_name = request.form.get("f-name-in")
    l_name = request.form.get("l-name-in")
    phone = request.form.get("phone")
    message = request.form.get("message")

    # Establish a db connection
    connection= mariadb.connect(**conn_params)
    c = connection.cursor()
    data = (f_name, l_name, phone, message)
    c.execute("INSERT INTO messages (f_name, l_name, phone, message) VALUES (%s, %s, %s, %s)", data)
    connection.commit()
    c.close()
    connection.close()
    m = "FROM: " + f_name + " " + l_name + "\nPHONE: " + phone + "\n" + message
    sns.publish(PhoneNumber="+14038897632", Message=m)
    sent_messages(m, "4038897632")
    return "contact submitted"

# Forgot Password Page
@app.route("/forgot-password", methods=["GET", "POST"])
def forgotPassword():
    session['referrer'] = ""
    f_name = session.get('f_name')
    l_name = session.get('l_name')
    logged_in = session.get('logged_in')
    return render_template("Forgot-Password.html", loggedIn=logged_in, f_name=f_name, l_name=l_name)

# Forgot Password Form and Verify Phone Page
@app.route("/forgot-password-form", methods=["GET","POST"])
def forgotPasswordForm():
    p = request.form.get("phone")
    session['phone'] = p
    verification_code = str(random.randint(1000, 9999))
    session['verification_code'] = verification_code
    m="SodaKid Password Reset Verification Code: " + verification_code
    sns.publish(PhoneNumber="+1" + p, Message=m)
    sent_messages(m, p)
    return redirect("/verify-phone")

# Verify Phone Page
@app.route("/verify-phone", methods=["GET", "POST"])
def verifyPhone():
    session['referrer'] = ""
    return render_template("Verify-Phone.html")

# Verify Phone Form
@app.route("/verify-phone-form", methods=["GET", "POST"])
def verifyPhoneForm():
    verification_code = session.get('verification_code')
    wrong_pass_code = False
    num1 = request.form.get("num1")
    num2 = request.form.get("num2")
    num3 = request.form.get("num3")
    num4 = request.form.get("num4")
    if (num1.strip() + num2.strip() + num3.strip() + num4.strip() == verification_code.strip()):
        return render_template("Password-Reset.html")
    else:
        wrong_pass_code = True
        return render_template("Verify-Phone.html", wrongPassCode=wrong_pass_code)

# Send Verify Phone Code again
@app.route("/phone-code-again", methods=["GET","POST"])
def sendPhoneCodeAgain():
    phone = session.get('phone')
    verification_code = str(random.randint(1000, 9999))
    session['verification_code'] = verification_code
    m="SodaKid Password Reset Verification Code: " + verification_code
    sns.publish(PhoneNumber="+1" + phone, Message=m)
    sent_messages(m, phone)
    return redirect("/verify-phone")

# Password Reset Form
@app.route("/password-reset-form", methods=["POST"])
def passwordResetForm():
    global conn_params
    phone = session.get('phone')
    password = request.form.get("pass-in")
    # Establish a db connection
    connection= mariadb.connect(**conn_params)
    c = connection.cursor()
    data = (password, phone)
    c.execute("""UPDATE customers
                SET password = %s
                WHERE phone = %s;""", data)
    connection.commit()
    c.close()
    connection.close()
    session['referrer'] = "pass-reset"
    return redirect("/")

# Login Page
@app.route("/login", methods=["GET", "POST"])
def login():
    session['referrer'] = ""
    return render_template("Login.html")

# Login Form
@app.route("/login-form", methods=["POST"])
def loginForm():
    global conn_params
    bad_login = False
    email = request.form.get("email")
    session['email'] = email
    password = request.form.get("pass")
    session['password'] = password
    # Establish a db connection
    connection= mariadb.connect(**conn_params)
    c = connection.cursor()
    data = (email,)
    c.execute("SELECT * FROM customers WHERE email = %s;", data)
    response = c.fetchall()
    connection.commit()
    c.close()
    connection.close()
    session['referrer'] = "login-form"
    for customer in response:
        if (password == customer[5]):
            session['customer_id'] = customer[0]
            session['logged_in'] = True
            # Establish a db connection
            connection= mariadb.connect(**conn_params)
            c = connection.cursor()
            data = (session.get('customer_id'),)
            c.execute("SELECT * FROM customers WHERE customer_id=%s", data)
            account_info = c.fetchall()
            session['f_name'] = account_info[0][1]
            session['l_name'] = account_info[0][2]
            session['phone'] = "(" + account_info[0][3][0:3] + ") " + account_info[0][3][3:6] + "-" + account_info[0][3][6:10]
            session['email'] = account_info[0][4]
            session['password'] = account_info[0][5]
            resp = make_response(redirect("/"))
            if session.get('please_login_alert'):
                session['please_login_alert'] = False
                resp = make_response(redirect("/place-order"))
            resp.set_cookie('ID', str(session.get('customer_id')))
            data = (str(session.get('customer_id')),)
            c.execute("INSERT INTO app_visited (cookie) VALUES (%s)", data)
            connection.commit()
            c.close()
            connection.close()
            return resp
    bad_login = True
    return render_template("Login.html", badLogin=bad_login)

# Sign Up Page
@app.route("/sign-up", methods=["GET", "POST"])
def signUp():
    session['referrer'] = ""
    return render_template("Sign-Up.html")

# Sign Up Form
@app.route("/sign-up-form", methods=["GET","POST"])
def signUpForm():
    existingEmail=False
    session['f_name'] = request.form.get("f-name-in")
    session['l_name'] = request.form.get("l-name-in")
    session['email'] = request.form.get("email-in")
    session['phone'] = request.form.get("phone")
    session['password'] = request.form.get("pass-in")
    # Establish a db connection
    connection= mariadb.connect(**conn_params)
    c = connection.cursor()
    data = ('%' + session.get('email') + '%',)
    c.execute("SELECT * FROM customers WHERE email LIKE %s", data)
    response = c.fetchall()
    print(response)
    c.close()
    connection.close()
    if not response:
        verification_code = str(random.randint(1000, 9999))
        session['verification_code'] = verification_code
        m="SodaKid Account Creation Verification Code: " + verification_code
        sns.publish(PhoneNumber="+1" + session.get('phone'), Message=m)
        sent_messages(m, session.get('phone'))
        return redirect("/verify-account")
    else:
        existingEmail=True
        return render_template('Sign-Up.html', existingEmail=existingEmail)

# Send Verify Phone Code again
@app.route("/account-code-again", methods=["GET","POST"])
def sendAccountCodeAgain():
    verification_code = str(random.randint(1000, 9999))
    session['verification_code'] = verification_code
    m="SodaKid Account Creation Verification Code: " + verification_code
    sns.publish(PhoneNumber="+1" + session.get('phone'), Message=m)
    sent_messages(m, session.get('phone'))
    return redirect("/verify-account")

# Verify Account Page
@app.route("/verify-account", methods=["GET", "POST"])
def verifyAccnt():
    return render_template("Verify-Account.html")

# Verify Account Form
@app.route("/verify-account-form", methods=["GET", "POST"])
def verifyAccntForm():
    global conn_params
    wrong_account_code = False
    num1 = request.form.get("num1")
    num2 = request.form.get("num2")
    num3 = request.form.get("num3")
    num4 = request.form.get("num4")
    if (num1.strip() + num2.strip() + num3.strip() + num4.strip() == session.get('verification_code').strip()):
        stripe_id = stripe.Customer.create(name=session.get('f_name') + ' ' + session.get('l_name'), email = session.get('email'))["id"]
        session['stripe_id'] = stripe_id
        # Establish a db connection
        connection= mariadb.connect(**conn_params)
        c = connection.cursor()
        data = (session.get('f_name'), session.get('l_name'), session.get('phone'), session.get('email'), session.get('password'), stripe_id)
        c.execute("INSERT INTO customers (f_name, l_name, phone, email, password, stripe_id) VALUES (%s, %s, %s, %s, %s, %s)", data)
        session['customer_id'] = c.lastrowid
        connection.commit()
        c.close()
        connection.close()
        session['logged_in'] = True
        session['referrer'] = "sign-up-form"
        return redirect("/")
    else:
        wrong_account_code=True
        return render_template("Verify-Account.html", wrongAccountCode=wrong_account_code)

# Account Page
@app.route("/account", methods=["GET", "POST"])
def account():
    global conn_params
    session['referrer'] = ""
    # Establish a db connection
    connection= mariadb.connect(**conn_params)
    c = connection.cursor()
    data = (session.get('customer_id'),)
    c.execute("SELECT * FROM customers WHERE customer_id=%s", data)
    account_info = c.fetchall()
    f_name = account_info[0][1]
    l_name = account_info[0][2]
    phone = "(" + account_info[0][3][0:3] + ") " + account_info[0][3][3:6] + "-" + account_info[0][3][6:10]
    email = account_info[0][4]
    password = account_info[0][5]
    c.execute("SELECT date, time, num_cans, can_type FROM exchanges WHERE customer_id=%s", data)
    previous_exchanges = c.fetchall()
    c.close()
    connection.close()
    return render_template("Account.html", loggedIn=session.get('logged_in'), f_name=f_name, l_name=l_name, phone=phone, email=email, password=password, previous_exchanges=previous_exchanges)

# Log Out
@app.route("/log-out", methods=["GET", "POST"])
def logOut():
    session['referrer'] = "logged-out"
    session['logged_in'] = False
    return redirect("/")

# Place Order Page
@app.route("/place-order", methods=["GET", "POST"])
def placeOrder():
    if session.get('logged_in'):
        today = date.today() # Today's Full Date (2024-01-11)
        month = int(today.strftime("%m").replace("0", "")) # Current Month starting at 1
        year = int(today.strftime("%Y")) # Current year
        months=['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        if (year % 4 == 0): # Check for leap year
            dim[1] = 29
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        d = int(today.strftime("%d"))
        wd = int(today.strftime("%w"))
        d1 = calendar.weekday(year, month, 1) # 0 is monday
        month -= 1 # Current Month from 0-11
        days_of_week = []
        weekday = d1+1
        for i in range(dim[month]):
            if weekday > 7:
                weekday = 1
            days_of_week.append(weekday)
            weekday += 1
        current_time = int(datetime.now().strftime("%H"))
        session['referrer'] = ""
        blueMax = 12
        pinkMax = 4
        # Establish a db connection
        connection= mariadb.connect(**conn_params)
        c = connection.cursor()
        availability_by_day_a_blue = [[],[]]
        availability_by_day_p_blue = [[],[]]
        availability_by_day_a_pink = [[],[]]
        availability_by_day_p_pink = [[],[]]
        for x in range(2):
            data = (str(month+x+1) + "_" + '%' + "_" + str(year), "Blue (Original)")
            if (month+x > 12):
                data = (str((month+x+1)%12) + "_" + '%' + "_" + str(year+1),)
            for i in range(dim[month+x]):
                availability_by_day_a_blue[x].append(0)
                availability_by_day_p_blue[x].append(0)
                availability_by_day_a_pink[x].append(0)
                availability_by_day_p_pink[x].append(0)
            c.execute("SELECT date, time, num_cans FROM exchanges WHERE date LIKE %s AND can_type LIKE %s ORDER BY date", data)
            current_month_exchanges = c.fetchall()
            for exchange in current_month_exchanges:
                day_of_exchange=int(exchange[0].split("_")[1])
                if (exchange[1]=='a'):
                    availability_by_day_a_blue[x][day_of_exchange-1]+=exchange[2]
                else:
                    availability_by_day_p_blue[x][day_of_exchange-1]+=exchange[2]
            data = (str(month+x+1) + "_" + '%' + "_" + str(year), "Pink (Terra)")
            c.execute("SELECT date, time, num_cans FROM exchanges WHERE date LIKE %s AND can_type LIKE %s ORDER BY date", data)
            current_month_exchanges = c.fetchall()
            for exchange in current_month_exchanges:
                day_of_exchange=int(exchange[0].split("_")[1])
                if (exchange[1]=='a'):
                    availability_by_day_a_pink[x][day_of_exchange-1]+=exchange[2]
                else:
                    availability_by_day_p_pink[x][day_of_exchange-1]+=exchange[2]
        c.close()
        connection.close()
        print(availability_by_day_a_blue[0])
        print(availability_by_day_p_blue[0])
        print(availability_by_day_a_pink[0])
        print(availability_by_day_p_pink[0])
        return render_template("Place-Order.html", m=month, months=months, y=year, days=days, date=d, wd=wd, d1=d1, days_of_week=days_of_week, dim=dim, current_time=current_time, loggedIn=session.get('logged_in'), f_name=session.get('f_name'), l_name=session.get('l_name'), availability_by_day_a_blue=availability_by_day_a_blue, availability_by_day_p_blue=availability_by_day_p_blue, availability_by_day_a_pink=availability_by_day_a_pink, availability_by_day_p_pink=availability_by_day_p_pink, blueMax=blueMax, pinkMax=pinkMax)
    else:
        session['please_login_alert']=True
        return render_template("Login.html", please_login_alert=session.get('please_login_alert'))

# Number of canisters
@app.route("/num-cans", methods=["POST"])
def num_cans():
    session['num_cans'] = request.form.get("num-cans")
    return session.get('num_cans')

# Type of canister
@app.route("/can-type", methods=["POST"])
def can_type():
    session['can_type'] = request.form.get("can-type")
    return "can_type = " + session.get('can_type')

@app.route('/success', methods=['GET'])
def order_success():
    global conn_params
    num_cans = session.get('num_cans')
    can_type = session.get('can_type')
    time = session.get('time')
    date_of_exchange = session.get('date_of_exchange')
    customer_id = session.get('customer_id')
    phone = session.get("phone")
    #session = stripe.checkout.Session.retrieve(request.args.get('session_id'))
    # Establish a db connection
    connection= mariadb.connect(**conn_params)
    c = connection.cursor()
    data = (customer_id, time, date_of_exchange, num_cans, can_type)
    c.execute("INSERT INTO exchanges (customer_id, time, date, num_cans, can_type) VALUES (%s, %s, %s, %s, %s)", data)
    session['exchange_id'] = c.lastrowid
    exchange_id = session.get('exchange_id')
    connection.commit()
    data = (customer_id, exchange_id, can_type, num_cans)
    c.execute("INSERT INTO payments (customerid, exchange_id, can_type, numcans) VALUES (%s, %s, %s, %s)", data)
    connection.commit()
    c.close()
    connection.close()
    order_date = date_of_exchange.replace("_", "/")
    instructions = ''
    if can_type == 'Pink (Terra)':
        instructions = 'in the mailbox to the right of the door.\nThank you!\nSodaKid'
    else:
        instructions = 'in the brown box to the right of the door.\nThank you!\nSodaKid'
    m="SodaKid Exchange Confirmation: \nInstructions: Please arrive at 2005 29 Ave SW Calgary between 5:00pm and 9:00pm on " + order_date + " and refer to the instructions " + instructions
    if (time=="a"):
        m="SodaKid Exchange Confirmation: \nInstructions: Please arrive at 2005 29 Ave SW Calgary between 7:00am and 5:00pm on " + order_date + " and refer to the instructions " + instructions
    sns.publish(PhoneNumber="+1" + phone, Message=m)
    sent_messages(m, phone)
    return render_template("Success.html", loggedIn=session.get('logged_in'), f_name=session.get('f_name'), l_name=session.get('l_name'), order_date=order_date, time=time)

@app.route('/cancelled', methods=['GET'])
def order_cancelled():
    return render_template("Cancel.html", loggedIn=session.get('logged_in'), f_name=session.get('f_name'), l_name=session.get('l_name'))

DOMAIN = 'https://sodakid.ca'

@app.route('/create-checkout-session/<t>/<d>', methods=['GET', 'POST'])
def create_checkout_session(t, d):
    session['time'] = t
    session['date_of_exchange'] = d
    date_of_exchange = session.get('date_of_exchange')
    customer_id = session.get('customer_id')
    can_type = session.get('can_type')
    num_cans = session.get('num_cans')
    #test_price_id = 'price_1OZOORJn3PNSsZghOj5X64uz'
    terra_price_id = 'price_1OZOilJn3PNSsZghHeUuOAwR'
    og_price_id = 'price_1OZOhtJn3PNSsZghJesSah6t'
    if (session.get('can_type') == "Blue (Original)"):
        price_id=og_price_id
    else:
        price_id=terra_price_id
    try:
        checkout_session = stripe.checkout.Session.create(
            customer=session.get("stripe_id"),
            submit_type='pay',
            billing_address_collection='auto',
            line_items=[
                {
                    # Price ID of the canisters
                    'price': price_id,
                    'quantity': session.get('num_cans'),
                },
            ],
            mode='payment',
            success_url=DOMAIN + '/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=DOMAIN + '/place-order',
        )
        print(checkout_session)
    except Exception as e:
        return str(e)

    return render_template_string('<script>window.location.replace("{{ checkout_session.url }}");</script>', checkout_session=checkout_session)

if __name__ == "__main__":
    c.close()
    connection.close()
    app.run(host="0.0.0.0", port=5000, debug=True)