"""
Script to manage RE pathways
Script will prompt user for pathway info for adding or removal
"""
import sys
import time
import db_util
import os

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
	ds_env = raw_input("Managing pathways; which db? Please enter one of the following: [internal(isb), gdac(isb), tut]\n")	
	config = (loadConfig(ds_env))
	operation = raw_input("ADD or DELETE pathways?(required)\n")
	pathwayname = raw_input("Enter pathway name(required)\n")
	pathwaysource = raw_input("Enter pathway source(required but custom okay)\n")
	
	if (len(pathwayname) < 1 or len(pathwaysource) < 1):
		print "Invalid pathway defined, check your inputs"
		sys.exit(-1)
	if (operation.upper() == "ADD"):
		pathwaymembers = raw_input("Enter pathway members(required and comma separated) e.g.\nTP53,GENE1,GENE2...\n")
		pathwayurl = raw_input("Enter pathway source url(optional)\n")
        
		if (len(pathwaymembers) < 1):
			print "Invalid pathway defined, check your inputs"
			sys.exit(-1)
		#print "name %s\n members %s\n source %s\n url%s" %(pathwayname, pathwaymembers, pathwaysource, pathwayurl) 
		insertSql = "insert into random_forest.pathways values('%s', '%s', '%s', '%s')" %(pathwaysource, pathwayname, pathwayurl,pathwaymembers)
		rc = db_util.executeInsert(config, insertSql)
		if (rc >= 0):
			print "%s added" %pathwayname
		else:
			print "Problems with adding - return code is %i" % rc
	elif (operation.upper() == "DELETE"):
		deleteSql = "delete from random_forest.pathways where pname = '%s' and psource = '%s'" %(pathwayname, pathwaysource)
		rc = db_util.executeInsert(config, deleteSql)
		if (rc >= 0):
			print "%s removed" %pathwayname
		else:
			print "Problems with deleting - return code is %i" % rc
	else:
		print "operation %s not supported" %(operation)	
