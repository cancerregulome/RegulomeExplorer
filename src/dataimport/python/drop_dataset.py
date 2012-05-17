import sys
import time
import db_util
import os

def getDatasets(config):
	rows = db_util.executeSelect(config, "select label, method, comments from regulome_explorer_dataset")
	return rows


def executeDrop(schemafile_path, config):
	cmd = "mysql -h %s --port %s -u%s -p%s < %s" %(db_util.getDBHost(config), db_util.getDBPort(config), db_util.getDBUser(config), db_util.getDBPassword(config), schemafile_path)
	#print "Dropping label %s" %(cmd)
	os.system(cmd)
	print "Dropped label %s" %schemafile_path

def prepDropLabel(label):
	
	templatefile = open("../sql/drop_ds_template.sql", "r")
	tlines = templatefile.read()
	ds_lines = tlines.replace("#REPLACE#", label)
	ds_name = templatefile.name.replace("template", label)
	ds_name = ds_name.replace("sql", "sql_processing", 1)
	ds_file = open(ds_name, "w")
	ds_file.write("use %s;\n" %(db_util.getDBSchema(config)))
	ds_file.write(ds_lines)
	ds_file.close()
	templatefile.close()
	return ds_file.name

def loadConfig(env):
	configFile = ""
	if (env == "internal"):
		configFile = "../config/rfex_sql_sandbox.config"
	elif (env == "tut"):
		configFile = "../config/rfex_sql.config"
	elif (env == "gdac"):
		configFile = "../config/rfex_sql_gdac.config"
	else:
		print "The env selected is invalid " + env
		sys.exit(-1)
	config = db_util.getConfig(configFile)
	return config




if __name__=="__main__":
	ds_env = raw_input("Deleting datasets, Please enter one of the following: [internal(isb), gdac(isb), tut]\n")	
	config = (loadConfig(ds_env))
	list = getDatasets(config)
	if (list != None):
		print "\nHere are the available datasets\nds_label\tmethod\tcomments"
		mylist = []
		for l in list:
			print "\t".join(l[0:3]) 
			mylist.append(l[0])
		ds = raw_input("Enter dataset label to drop from db, for > 1 separate the datasets by comma\n")
		if (ds != None and len(ds) > 1):
			drop_list = ds.split(",")
			if ("".join(mylist).find("".join(drop_list)) == -1 ):
				print "\nExiting - Your datasets are not in existing dataset list, must be exact!\n"
				sys.exit(-1)
			for label in drop_list:
				dropFile = prepDropLabel(label)
				executeDrop(dropFile, config)
		else:
			print "Exiting"
			sys.exit(-1)
