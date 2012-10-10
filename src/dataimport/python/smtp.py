import smtplib
from email.MIMEText import MIMEText

def sendMail(frome, to, subject, text):
	print "sending dataimport notification from %s to %s" %(frome, to)
	try:
		msg = MIMEText(text, 'plain')
		msg['Subject'] = subject
		msg['From'] = frome
		s = smtplib.SMTP('mailhost.systemsbiology.net')
		s.sendmail(msg['From'], to, msg.as_string())
		s.quit()
        except Exception, inst:
		print "failed smtp " + str(inst)
                return inst

def main(frome, to, subject, text):	
	sendMail(frome, to, subject, text)

if __name__ == "__main__":
	to = ['jlin@systemsbiology.org']
	main("jlin@systemsbiology.net", "jlin212@gmail.com", "RE Dataimport Notification", "full text message")
