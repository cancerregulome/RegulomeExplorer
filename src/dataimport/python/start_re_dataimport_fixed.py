import os
import sys
import time
import ConfigParser
import process_meta_config
import parse_features_rfex

def buildMeta(meta_file, config_file):
	if (config_file == ""):
		config_file = "../config/rfex_sql.config"       
	config = ConfigParser.RawConfigParser()
        config.read(meta_file)
	meta_config = process_meta_config.loadMetaConfig(meta_file)
	python_bin = process_meta_config.getPythonBin(meta_config)	
	dm_method = process_meta_config.getMiningMethod(meta_config)
	source = process_meta_config.getSource(config)
	afm = process_meta_config.getAfm(config)
	associations = process_meta_config.getAssociations(config)
	annotations = process_meta_config.getFeatureAnnotations(config)
	quantileFeatures = process_meta_config.getQuantileFeatures(config)
	dslabel = process_meta_config.getDatasetLabel(config)
	comment = process_meta_config.getBuildComment(config)
	description = process_meta_config.getAfmDescription(config)
	dsdate = process_meta_config.getDatasetDate(config)
	diseaseCode = process_meta_config.getDiseaseCode(config)
	contact = process_meta_config.getContact(config)
	collapseDirection = process_meta_config.getCollapseEdgeDirection(config)
	reverseDirection = process_meta_config.getReverseDirection(config)
	pvalueRepresentation = process_meta_config.getPValueTransform(config)
	#store intermediate sql files, tsv, bash files here
	resultsPath = process_meta_config.getResultsDir(config)
	slash = "/"
	if (resultsPath[-1] == "/"):
		slash = ""
	if (not os.path.exists(resultsPath)):
		os.system("mkdir " + resultsPath)
		os.system("chmod 777 " + resultsPath)
	if (not os.path.exists(resultsPath + slash + dslabel)):
		os.system("mkdir " + resultsPath + slash + dslabel)
		os.system("chmod 777 " + resultsPath + slash + dslabel)
	resultsPath = resultsPath + dslabel
	if (resultsPath[-1] != "/"):
		resultsPath = resultsPath + "/"
	print "Starting %s dataimport %s \nlabel %s afm %s annotations %s associations %s collapse_direction %s" %(dm_method, time.ctime(), dslabel, afm, annotations, associations, collapseDirection)
	util_cmd = python_bin + " db_util.py " + config_file
	os.system(util_cmd)
	#create re schema for dataset label
	reschema_cmd = python_bin + " createSchemaFromTemplate.py " + dslabel + " ../sql/create_schema_re_template.sql " + config_file + " " + resultsPath
	print "\nCreating schema " + reschema_cmd + " " + time.ctime()
	os.system(reschema_cmd)
	fIntOutFile = ""
	lg = "unlogged"	
	#doGenehub = process_meta_config.getDoGenehub(config)
	method_schema = "../sql/create_schema_rface_template.sql";
	if (dm_method == "pairwise"):
		method_schema = "../sql/create_schema_pairwise_template.sql";		
		lg = "logged"
	
	#process afm with optional annotations, groupings
	process_afm_cmd	= python_bin + " parse_features_rfex.py %s %s %s %s %s %s %s" %(afm, dslabel, config_file, annotations, quantileFeatures, resultsPath, fIntOutFile)
	print "\nProcessing feature matrix " + process_afm_cmd + " " + time.ctime()
	os.system(process_afm_cmd)
	#method specific schema 
	dm_schema_cmd = python_bin + " createSchemaFromTemplate.py " + dslabel + " " + method_schema + " " + config_file + " " + resultsPath
	os.system(dm_schema_cmd)	
	if (dm_method == "RF-ACE"):
		process_rf_associations_cmd = python_bin + " parse_associations_rfex.py %s %s %s %s %s %s %s %s %s %s %s %s %s" %(afm, associations, dslabel, config_file, annotations, collapseDirection, reverseDirection, resultsPath, pvalueRepresentation ,process_meta_config.getDoPubcrawl(config), process_meta_config.getNotify(config), process_meta_config.getKeepUnmapped(config), fIntOutFile)
		print "\nProcessing RF-ACE associations " + process_rf_associations_cmd + " " + time.ctime()	
		os.system(process_rf_associations_cmd)
	if (dm_method == "pairwise"):
		process_pairwise_associations_cmd = python_bin + " parse_pairwise.py %s %s %s %s %s %s %s %s %s %s" %(afm, associations, dslabel, pvalueRepresentation, config_file, resultsPath, process_meta_config.getDoPubcrawl(config), process_meta_config.getNotify(config), process_meta_config.getKeepUnmapped(config), fIntOutFile)
		print "\nProcessing pairwise associations " + process_pairwise_associations_cmd + " " + time.ctime()
		os.system(process_pairwise_associations_cmd)
	
	update_re_store_cmd = python_bin + ' update_rgex_dataset.py %s %s %s %s "%s" "%s" "%s" %s %s "%s" %s %s' % \
		( dslabel, afm, associations, dm_method, source, description, comment, \
		  config_file, resultsPath, dsdate, diseaseCode, contact )
	print "\nRegistering dataset " + update_re_store_cmd + " " + time.ctime()
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
	configFile = ""
        if (len(sys.argv) == 3):
                configFile = sys.argv[2]
        buildMeta(metafile, configFile)

