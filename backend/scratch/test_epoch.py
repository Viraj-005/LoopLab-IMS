import pyotp
import datetime
import calendar

for_time = datetime.datetime.now()
print("datetime.now():", for_time)
epoch1 = calendar.timegm(for_time.utctimetuple())
print("Epoch from naive now via timegm:", epoch1)

import time
epoch2 = int(time.time())
print("True epoch via time.time():", epoch2)

import time
print("Diff:", epoch1 - epoch2)

secret = pyotp.random_base32()
totp = pyotp.TOTP(secret)
print("TOTP now:", totp.now())
