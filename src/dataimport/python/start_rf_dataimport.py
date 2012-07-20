import os
import sys
import time
import ConfigParser

def getFeatureAnnotations(config):
	return config.get("build", "annotations")

def getAssociations(config):
	return config.get("build", "associations")

def getAfm(config):
	return config.get("build", "afm")

def getAfmDescription(config):
	return config.get("build", "afm_description")

def getBuildComment(config):
        return config.get("build", "comment")

def getDatasetLabel(config):
	return config.get("build", "dataset_label")

def getResultsDir(config):
	return config.get("results", "path")

def getQuantileFeatures(config):
	return config.get("build", "quantile_features")

def getSource(config):
	return config.get("build", "source")

#dbetl configs
def getPValueTransform(config):
	return config.get("dbetl", "pvalue_transform") 

def getCollapseEdgeDirection(config):
	return config.get("dbetl", "collapse_edge_directions")

def getReverseDirection(config):
	return config.get("dbetl", "reverse_directions")

#lambda function for pvalue transform
#pv_neglog10_lamba

def buildMeta(metaf, reinstance="tut"):
	config = ConfigParser.RawConfigParser()
        config.read(metaf)	
	source = getSource(config)
	afm = getAfm(config)
	associations = getAssociations(config)
	annotations = getFeatureAnnotations(config)
	quantileFeatures = getQuantileFeatures(config)
	dslabel = getDatasetLabel(config)
	comment = getBuildComment(config)
	description = getAfmDescription(config)
	collapseDirection = getCollapseEdgeDirection(config)
	pvalueRepresentation = getPValueTransform(config)
	resultsPath = getResultsDir(config)
	#lambda
	print "starting dataimport %s \nlabel %s afm %s annotations %s associations %s collapse_direction %s" %(time.ctime(), dslabel, afm, annotations, associations, collapseDirection)
	config_file = "../config/rfex_sql.config"	
	if (reinstance != "tut"):
		#check public, sandbox, tcga
		print "ToDo to handle re specific instance config files"
	util_cmd = "python db_util.py " + config_file
	os.system(util_cmd)
	#create re schema for dataset label
	reschema_cmd = "python createSchemaFromTemplate.py " + dslabel + " ../sql/create_schema_re_template.sql " + config_file
	os.system(reschema_cmd)	
	#process afm with optional annotations, groupings
	process_afm_cmd	= "python parse_features_rfex.py %s %s %s %s %s %s" %(afm, dslabel, config_file, annotations, quantileFeatures, resultsPath)
	os.system(process_afm_cmd)
	#method specific schema 
	rf_schema_cmd = "python createSchemaFromTemplate.py " + dslabel + " ../sql/create_schema_rface_template.sql " + config_file
	os.system(rf_schema_cmd)	
	#process associations
	collapseDirection = getCollapseEdgeDirection(config)
	reverseDirection = getReverseDirection(config)
	process_rf_associations_cmd = "python parse_associations_rfex.py %s %s %s %s %s %s %s %s" %(afm, associations, dslabel, config_file, annotations, collapseDirection, reverseDirection, resultsPath)
	print process_rf_associations_cmd
	os.system(process_rf_associations_cmd)
	update_re_store_cmd = 'python update_rgex_dataset.py %s %s %s %s "%s" "%s" "%s" %s %s' %(dslabel, afm, associations, 'RF-ACE', source, description, comment, config_file, resultsPath)
	os.system(update_re_store_cmd) 		
	print "completed dataimport %s \nlabel %s afm %s annotations %s associations %s" %(time.ctime(), dslabel, afm, annotations, associations)

if __name__ == "__main__":
	errmsg = "Parameter Error: Data import requires a directory containing a META file"
	if (len(sys.argv) < 2):
		print(errmsg)
		sys.exit(1)
	hasmeta = False
	if (os.path.isfile(sys.argv[1])):
		metafile = sys.argv[1]
		hasmeta = True
	else:
		metadir = os.listdir(sys.argv[1])
		for file in metadir:
			if (file == "META"):
				metafile = sys.argv[1] + "/" + file
				hasmeta = True
				break
        if (hasmeta == False):
		print(errmsg)
		sys.exit(-1)
	buildMeta(metafile)

