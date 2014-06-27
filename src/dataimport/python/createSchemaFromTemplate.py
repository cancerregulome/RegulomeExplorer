#!/usr/bin/python
import sys
import os
import time
import db_util

placeHolder = '#REPLACE#'
"""myhost = db_util.getDBHost() #config.get("mysql_jdbc_configs", "host")
myport = db_util.getDBPort()
mydb = db_util.getDBSchema() #config.get("mysql_jdbc_configs", "db")
myuser = db_util.getDBUser() #config.get("mysql_jdbc_configs", "username")
mypw = db_util.getDBPassword() #config.get("mysql_jdbc_configs", "password")
"""

def executeSchema(schemafile_path, config):
	cmd = "mysql -h %s --port %s -u%s -p%s < %s" %(db_util.getDBHost(config), db_util.getDBPort(config), db_util.getDBUser(config), db_util.getDBPassword(config), schemafile_path)
	print "Running system call %s" %(cmd)
	os.system(cmd)	

def updateFromTemplate(label, template, configfile, resultsPath):
	template_file = open(template)
	schema_out_name = template_file.name.replace('template', label)
	schema_out_name = schema_out_name.replace('sql', "sql_processing", 1)
	sql_processing_dir = resultsPath + "/sql_processing"
	if (not os.path.exists(sql_processing_dir)):
		os.system("mkdir " + sql_processing_dir)
		os.system("chmod 777 " + sql_processing_dir)
	schema_out_name = sql_processing_dir + "/" + schema_out_name.split("/")[-1]
	schema_file = open(schema_out_name,'w')
	config = db_util.getConfig(configfile)
	schema_file.write("use %s;\n" %(db_util.getDBSchema(config)))
	for line in template_file:
		schema_file.write(line.replace(placeHolder, label))
	schema_file.close()
	template_file.close()
	executeSchema(schema_file.name, config)
	print "Done creating schema file from template %s" % time.ctime()


if __name__ == "__main__":
	if (len(sys.argv) != 5):
		print 'Proper usage is python createSchemaFromTemplate.py schema_label schema_sql_template_file configfile intermediateResultsPath'	
	label = sys.argv[1]
	template = sys.argv[2]
	configfile = sys.argv[3]
	resultsPath = sys.argv[4]
	updateFromTemplate(label, template, configfile, resultsPath)


