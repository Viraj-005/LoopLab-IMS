import pyotp
import datetime
import calendar

utc_now = datetime.datetime.now(datetime.timezone.utc)
epoch_from_utc = calendar.timegm(utc_now.utctimetuple())
print("Epoch from timezone aware via timegm:", epoch_from_utc)

import time
true_epoch = int(time.time())
print("True epoch via time.time():  ", true_epoch)
print("Diff:", epoch_from_utc - true_epoch)

totp = pyotp.TOTP("JBSWY3DPEHPK3PXP")
print("Verify:", totp.verify("123456", for_time=utc_now))
