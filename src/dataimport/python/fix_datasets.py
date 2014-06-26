import sys
import db_util
import os

def getDatasets(config):
    rows = db_util.executeSelect(config, "select label, method, dataset_date, comments from regulome_explorer_dataset")
    return rows

def dropviews(label):

    tlines="DROP VIEW IF EXISTS v_#REPLACE#_features"
    ds_lines = tlines.replace("#REPLACE#", label)
    print ds_lines
    cmd = "mysql -h %s --port %s -u%s -p%s -e \"%s\" %s" %(db_util.getDBHost(config), db_util.getDBPort(config), db_util.getDBUser(config), db_util.getDBPassword(config), ds_lines, db_util.getDBSchema(config))
    os.system(cmd);


def fix(label):
    
    tlines="""DROP VIEW IF EXISTS v_#REPLACE#_feature_categorical_labels;
    CREATE VIEW v_#REPLACE#_feature_categorical_labels as
    SELECT DISTINCT label, alias, source, interesting_score from #REPLACE#_features where source = 'CLIN'
    UNION SELECT DISTINCT label, alias, source, interesting_score from #REPLACE#_features where source = 'SAMP'
    UNION SELECT DISTINCT label, alias, source, interesting_score from #REPLACE#_features where source = 'PRDM';
    """
    ds_lines = tlines.replace("#REPLACE#", label)
    print ds_lines
    cmd = "mysql -h %s --port %s -u%s -p%s -e \"%s\" %s" %(db_util.getDBHost(config), db_util.getDBPort(config), db_util.getDBUser(config), db_util.getDBPassword(config), ds_lines, db_util.getDBSchema(config))
    os.system(cmd)

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
    for set in datasets:
        print set[0]
#        dropviews(set[0])
