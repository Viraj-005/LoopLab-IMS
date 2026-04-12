import pyotp
import datetime
import calendar

# What happens if we pass utcnow?
utc_now = datetime.datetime.utcnow()
epoch_from_utc = calendar.timegm(utc_now.utctimetuple())
print("Epoch from utcnow via timegm:", epoch_from_utc)

import time
true_epoch = int(time.time())
print("True epoch via time.time():  ", true_epoch)
print("Diff:", epoch_from_utc - true_epoch)
