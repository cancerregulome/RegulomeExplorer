#!/usr/bin/python
import sys
import os
import time
import db_util

placeHolder = '#REPLACE#'
myhost = db_util.getDBHost() #config.get("mysql_jdbc_configs", "host")
myport = db_util.getDBPort()
mydb = db_util.getDBSchema() #config.get("mysql_jdbc_configs", "db")
myuser = db_util.getDBUser() #config.get("mysql_jdbc_configs", "username")
mypw = db_util.getDBPassword() #config.get("mysql_jdbc_configs", "password")

def executeSchema(schemafile_path):
	cmd = "mysql -h %s --port %s -u%s -p%s < %s" %(myhost, myport, myuser, mypw, schemafile_path)
	print "Running system call %s" %(cmd)
	os.system(cmd)	

def updateFromTemplate(label, template):
	template_file = open(template)
	schema_out_name = template_file.name.replace('template', label)
	schema_file = open(schema_out_name,'w')
	schema_file.write("use %s;\n" %(mydb))
	for line in template_file:
		schema_file.write(line.replace(placeHolder, label))
	schema_file.close()
	template_file.close()
	executeSchema(schema_file.name)
	print "Done creating schema file from template %s" % time.ctime()


if __name__ == "__main__":
	if (len(sys.argv) != 3):
		print 'Proper usage is python createSchemaFromTemplate.py schema_label schema_sql_template_file'	
	label = sys.argv[1]
	template = sys.argv[2]
	updateFromTemplate(label, template)


