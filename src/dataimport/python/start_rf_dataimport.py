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
	return config.get("build", "intermediate_results_dir")

def buildMeta(metaf, reinstance="tut"):
	config = ConfigParser.RawConfigParser()
        config.read(metaf)	
	afm = getAfm(config)
	associations = getAssociations(config)
	annotations = getFeatureAnnotations(config)
	dslabel = getDatasetLabel(config)
	comment = getBuildComment(config)
	description = getAfmDescription(config)
	#if feature annotations is blank, assume old dataImport work flow where the afm and featureAnnotation feature labels contain names and applicable chrom positions
	print "starting dataimport %s \nlabel %s afm %s annotations %s associations %s" %(time.ctime(), dslabel, afm, annotations, associations)
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
	#/tools/bin/python2.7 parse_features_rfex.py $feature_matrix_file $dataset_label_rf $config_file
	process_afm_cmd	= "python parse_features_rfex.py %s %s %s %s" %(afm, dslabel, config_file, annotations)
	os.system(process_afm_cmd)

	#python2.6 parse_associations_rfex.py $feature_matrix_file $associations_pw $dataset_label $config_file
	#python2.6 update_rgex_dataset.py $dataset_label $feature_matrix_file $associations_pw $method "$description" "$comments" $config_file

	#method specific schema 
	rf_schema_cmd = "python createSchemaFromTemplate.py " + dslabel + " ../sql/create_schema_rface_template.sql " + config_file
	os.system(rf_schema_cmd)
	#process associations
	process_rf_associations_cmd = "python parse_associations_rfex.py %s %s %s %s %s" %(afm, associations, dslabel, config_file, annotations)
	os.system(process_rf_associations_cmd)
	#$feature_matrix_file $associations_pw $dataset_label $config_file" 	
	#register build to re datasets
	update_restore_cmd = 'python update_rgex_dataset.py %s %s %s %s "%s" "%s" %s' %(dslabel, afm, associations, 'RF-ACE', description, comment, config_file)
	#print update_restore_cmd
	os.system(update_restore_cmd) 		
	print "completed dataimport %s \nlabel %s afm %s annotations %s associations %s" %(time.ctime(), dslabel, afm, annotations, associations)

if __name__ == "__main__":
	errmsg = "Parameter Error: Data import requires a directory containing a META file"
	if (len(sys.argv) < 2):
		print(errmsg)
		sys.exit(1)
	metadir = os.listdir(sys.argv[1])
	hasmeta = False
	for file in metadir:
		if (file == "META"):
			hasmeta = True
			metaf = open(sys.argv[1] + "/" + file, "r")
			buildMeta(sys.argv[1] + "/" + file)
        if (hasmeta == False):
		print(errmsg)
		sys.exit(-1)

