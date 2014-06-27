import sys
import db_util
import os

def getDatasets(config):
    rows = db_util.executeSelect(config, "select label, method, dataset_date, comments from regulome_explorer_dataset")
    return rows

def executeHide(schemafile_path, config):
    cmd = "mysql -h %s --port %s -u%s -p%s < %s" %(db_util.getDBHost(config), db_util.getDBPort(config), db_util.getDBUser(config), db_util.getDBPassword(config), schemafile_path)
    #print "Changing label %s" %(cmd)
    os.system(cmd)
    print "Changed label %s" %schemafile_path

def prepHideLabel(label, method):
    
    templatefile = open("../sql/hide_ds_template.sql", "r")
    tlines = templatefile.read()
    ds_lines = tlines.replace("#REPLACE#", label)
    ds_lines = ds_lines.replace("#METHOD#", method)
    ds_name = templatefile.name.replace("template", label)
    ds_name = ds_name.replace("sql", "sql_processing", 1)
    ds_file = open(ds_name, "w")
    ds_file.write("use %s;\n" %(db_util.getDBSchema(config)))
    ds_file.write(ds_lines)
    ds_file.close()
    templatefile.close()
    return ds_file.name

def removeHideFile(filename):
    os.remove(filename)

def loadConfig(env):
    configFile = ""
    if (env == "internal"):
        configFile = "../config/rfex_sql_sandbox.config"
    elif (env == "prod-giza"):
        configFile = "../config/rfex_sql.config"
    elif (env == "prod-breve"):
                configFile = "../config/rfex_sql_breve.config"
    elif (env == "gdac"):
        configFile = "../config/rfex_sql_gdac.config"
    else:
        print "The env selected is invalid " + env
        sys.exit(-1)
    config = db_util.getConfig(configFile)
    return config

if __name__=="__main__":
    ds_env = raw_input("Changing visibility of datasets, Please enter one of the following: [internal(isb), gdac, prod-giza, prod-breve]\n")    
    config = (loadConfig(ds_env))
    datasets = getDatasets(config)
    if (datasets != None):
        print "\nHere are the available datasets\nds_label\tmethod\tdate\tcomments"
        mylist = []
        for l in datasets:
            print "\t".join(l[0:4]) 
            mylist.append(l[0])
        ds = raw_input("Enter dataset label to drop from db, for > 1 separate the datasets by comma\n")
        if (ds != None and len(ds) > 1):
            hide_list = ds.split(",")
            if ("".join(mylist).find("".join(hide_list)) == -1 ):
                print "\nExiting - Your datasets are not in existing dataset list, must be exact!\n"
                sys.exit(-1)
            for label in hide_list:
                method = [x for x in datasets if x[0] == label][0][1]
                if method == "hidden":
                    print "\n" + label + " is currently set to hidden."
                    method = "pairwise"
                    print "\nChanging " + label + " to be visible\n"
                else:
                    print "\n" + label + " is currently set to visible."
                    method = "hidden"
                    print "\nChanging " + label + " to be hidden\n"
                hideFile = prepHideLabel(label, method)
                executeHide(hideFile, config)
                removeHideFile(hideFile)
        else:           
            print "Exiting"
            sys.exit(-1)
