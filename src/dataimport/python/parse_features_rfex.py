#!/usr/bin/python
"""
Processing features from in data_matrix and gexp interesting. Sample values and identifiers will also be extracted. 
The required dataset label indicates the set of schemas. 
"""
import db_util
import sys
import os
import time

features_hash = {}
gene_interesting_hash = {}
dataset_label = ""
feature_table = ""
sample_table = ""

"""
def is_numeric(val):
	try:
		float(val)
	except ValueError, e:
		return False
	return True
"""

if (not os.path.exists("./results")):
	os.system("mkdir results")

def populate_sample_meta(sampleList, config):
	"""
	sampleList needs to be a list of patients
	"""
	global dataset_label
	labelTokens = dataset_label.split("_")
	cancer_type = ""
	clabel = ""
	for label in labelTokens:
		for ct in db_util.getCancerTypes(config):
			if (label == ct):
				cancer_type = cancer_type + label + "_"	
	cancer_type = cancer_type[0:-1]
	clabel = dataset_label[len(cancer_type)+1:len(dataset_label)]			
	samColIndex = 0
	for sam in sampleList:
		#REPLACE INTO `tcga`.`SampleMeta` (sample_key,cancer_type,dataset_label,matrix_col_offset,meta_json) VALUES ('a' /*not nullable*/,'s' /*not nullable*/,'s' /*not nullable*/,0,'s');		
		insertSampleSql = "replace into sample_meta (sample_key,cancer_type,dataset_label,matrix_col_offset,meta_json) values ('%s', '%s', '%s', '%i', '%s');" %(sam, cancer_type,clabel,samColIndex,"{age:X,status:someStatus,comments:some comments}")
		db_util.executeInsert(config, insertSampleSql)
		samColIndex += 1
	print "Done populating sample list for " + dataset_label

def process_feature_matrix(dataset_label, matrix_file, persist_sample_meta, config):	
	global features_hash
	#config = db_util.getConfig(configfile)
	mydb = db_util.getDBSchema(config) #config.get("mysql_jdbc_configs", "db")
	myuser = db_util.getDBUser(config) #config.get("mysql_jdbc_configs", "username")
	mypw = db_util.getDBPassword(config) #config.get("mysql_jdbc_configs", "password")
	myhost = db_util.getDBHost(config) #config.get("mysql_jdbc_configs", "host")
	myport = db_util.getDBPort(config)
	if (not os.path.isfile(matrix_file)):
	        print matrix_file + " does not exist; unrecoverable ERROR"
		sys.exit(-1)
	feature_matrix_file = open(matrix_file)
	feature_table = mydb + "." + dataset_label + "_features"
	sample_table = mydb + "." + dataset_label + "_patients"
	fshout = open('./results/load_features_' + dataset_label + '.sh','w')
	outfile = open('./results/features_out_' + dataset_label + '.tsv','w')
	sampleOutfile = open('./results/sample_values_out_' + dataset_label + '.tsv','w')
	featureId = 0
	for line in feature_matrix_file:
		line = line.strip()	
		tokens = line.split('\t')
		if (featureId == 0 and persist_sample_meta == 1):                
                	sampleIds = ":".join(tokens[1:len(tokens)-1])
			populate_sample_meta(sampleIds.split(":"), config)				
			sampleOutfile.write(sampleIds + "\n");
			featureId += 1
			continue
		if (not features_hash.get(tokens[0])):
			valuesArray = []
			alias = tokens[0]
			alias = alias.replace('|', '_')
			features_hash[tokens[0]] = featureId
			data = alias.split(':')
			if len(data) > 4 and len(data[3]) > 3:
				data[3] = data[3][3:]
			if (len(data) == 7):
				alias = alias + ":"
				data.append("")
			patient_values = ":".join(tokens[1:len(tokens)-1])
			for val in tokens[1:(len(tokens)-1)]:
				if (db_util.is_numeric(val)):
					valuesArray.append(float(val))
				else:
					valuesArray.append(0.0)
			patient_value_mean = sum(valuesArray)/len(valuesArray)
			outfile.write(str(featureId) + "\t" + alias + "\t" + "\t".join(data) + "\t" + patient_values + "\t" + str(patient_value_mean) + "\n")
		else:
			print "duplicated feature in feature set:" + tokens[0]
		featureId += 1 
	feature_matrix_file.close()
	outfile.close()
	sampleOutfile.close()
	fshout.write("#!/bin/bash\n")
	fshout.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
	fshout.write("load data local infile '" + './results/features_out_' + dataset_label + '.tsv' + "' replace INTO TABLE " + feature_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	fshout.write("load data local infile '" + './results/sample_values_out_' + dataset_label + '.tsv' + "' replace INTO TABLE " + sample_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	fshout.write("\ncommit;")
	fshout.write("\nEOFMYSQL")
	fshout.close()
	print "processing done, running bulk load feature data to mysql %s" %time.ctime()
	return fshout

def getFeatureId(featureStr):
	global features_hash
        return features_hash.get(featureStr)

def getGeneInterestScore(featureStr):
	global gene_interesting_hash
	return gene_interesting_hash.get(featureStr)
 
def process_gexp_interest_score(interest_score_file, configfile):
	"""
	Requires valid full path gexp_interest file, extend this to accept other feature specific values, but schema needs to be defined
	"""
	global features_hash, dataset_label
	config = db_util.getConfig(configfile)
        mydb = db_util.getDBSchema(config) #config.get("mysql_jdbc_configs", "db")
        myuser = db_util.getDBUser(config) #config.get("mysql_jdbc_configs", "username")
        mypw = db_util.getDBPassword(config) #config.get("mysql_jdbc_configs", "password")
        myhost = db_util.getDBHost(config) #config.get("mysql_jdbc_configs", "host")
        myport = db_util.getDBPort(config)
        print "Begin processing feature specific values %s" %(time.ctime())
	gexp_interesting_file = open(interest_score_file)
        gexp_sh = open('./results/load_gexp_interesting_' + dataset_label + '.sh','w')
        gexp_sql = open('./results/gexp_interesting_score_' + dataset_label + '.sql','w')
	for line in gexp_interesting_file:
                tokens = line.strip().split("\t")
                gene_interesting_hash[tokens[0]] = tokens[1]
                gexp_sql.write("update %s set gene_interesting_score = %s where id = %i;\n" %(feature_table, tokens[1], features_hash.get(tokens[0])))
        gexp_sql.write("commit;\n")
        gexp_interesting_file.close()
        gexp_sql.close()
        gexp_sh.write("#!/bin/bash\n")
        gexp_sh.write('mysql -h ' + myhost + ' --port ' + myport + ' -u' + myuser + ' -p'+ mypw + ' < ' + gexp_sql.name + '\n')
        gexp_sh.write("\necho done updating gexp_interesting")
        gexp_sh.close()
	print "finished feature matrix bulk upload  %s" %(time.ctime())
	return gexp_sh

def process_pathway_associations(gsea_file_path, configfile):
	global features_hash, dataset_label
	config = db_util.getConfig(configfile)
        mydb = db_util.getDBSchema(config) #config.get("mysql_jdbc_configs", "db")
        myuser = db_util.getDBUser(config) #config.get("mysql_jdbc_configs", "username")
        mypw = db_util.getDBPassword(config) #config.get("mysql_jdbc_configs", "password")
        myhost = db_util.getDBHost(config) #config.get("mysql_jdbc_configs", "host")
        myport = db_util.getDBPort(config)

	gsea_file = open(gsea_file_path, 'r')
	pathway_hash = {}
	feature_pathways_table = mydb + "." + dataset_label + "_feature_pathways" 
	gsea_sh = open('./results/load_gsea_' + dataset_label + '.sh','w')   
	gsea_tsv_out = open('./results/gsea_processed_' + dataset_label + '.tsv','w')     
	for line in gsea_file:
		tokens = line.strip().split('\t')
		pathway = tokens[0].split(":")[2]
		feature = tokens[1]
		pvalue = tokens[2]
		pathway_type = ""
		pathway_name = ""
		if (not pathway_hash.get(tokens[0])):
			pathway_hash[tokens[0]] = tokens[0]
		if (pathway.find("KEGG") != -1):
			pathway_type = "KEGG"
			pathway_name = pathway.replace("KEGG_", "")
		elif (pathway.find("WIKIPW") != -1):
			pathway_type = "WIKIPW"
			pathway_name = pathway.replace("_WIKIPW", "")
		elif (pathway.find("BIOCARTA") != -1):
			pathway_type = "BIOCARTA"
			pathway_name = pathway.replace("BIOCARTA", "")
		else:
			pathway_type = ""
			pathway_name = pathway
		gsea_tsv_out.write(str(features_hash.get(feature)) + "\t" + feature + "\t" + pathway_name + "\t" + pathway_type + "\t" + pvalue + "\n")
	#print "%i Unique pathways" %(len(pathway_hash))				
	gsea_file.close()
	gsea_tsv_out.close()
	gsea_sh.write("#!/bin/bash\n")
	gsea_sh.write("mysql -h % --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
	gsea_sh.write("load data local infile '" + gsea_tsv_out.name + "' replace INTO TABLE " + feature_pathways_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';")
	gsea_sh.write("\ncommit;")
	gsea_sh.write("\nEOFMYSQL")
	gsea_sh.close()	
	print "done loading pathway associations %s" %(time.ctime())
	return gsea_sh

def subprocessAssociationIndex(assoc_file_path, assoc_type, association_index_out):
	global features_hash
	assoc_file = open(assoc_file_path,'r')
	for line in assoc_file:
		tokens = line.strip().split("\t")
		feature = tokens[0]
		score = tokens[1]
		association_index_out.write(str(features_hash.get(feature)) + "\t" + feature + "\t" + assoc_type + "\t" + score + "\n")
	assoc_file.close()
	return

def processGeneAssociation(datapath, configfile):
	"""
	-rwxr-xr-- 1 terkkila cncrreg    624887 May 31 00:20 GEXP_CLIN_association_index.tsv*
	-rwxr-xr-- 1 terkkila cncrreg    642188 May 31 00:16 GEXP_CNVR_association_index.tsv*
	-rwxr-xr-- 1 terkkila cncrreg    625082 May 31 00:18 GEXP_GNAB_association_index.tsv*
	-rwxr-xr-- 1 terkkila cncrreg    645677 May 31 00:14 GEXP_METH_association_index.tsv*
	-rwxr-xr-- 1 terkkila cncrreg    626148 May 31 00:17 GEXP_MIRN_association_index.tsv*
	-rwxr-xr-- 1 terkkila cncrreg    629823 May 31 00:21 GEXP_SAMP_association_index.tsv*
	"""
	global features_hash, dataset_label
	config = db_util.getConfig(configfile)
        mydb = db_util.getDBSchema(config) #config.get("mysql_jdbc_configs", "db")
        myuser = db_util.getDBUser(config) #config.get("mysql_jdbc_configs", "username")
        mypw = db_util.getDBPassword(config) #config.get("mysql_jdbc_configs", "password")
        myhost = db_util.getDBHost(config) #config.get("mysql_jdbc_configs", "host")
        myport = db_util.getDBPort(config)

	association_index_table = mydb + "." + dataset_label + "_association_index"
	association_index_out = open('./results/association_index_processed_' + dataset_label + '.tsv','w')
	association_index_sh = open('./results/load_association_index_' + dataset_label + '.sh','w')
	
	if (os.path.exists(path + "/GEXP_CLIN_association_index.tsv")):
		subprocessAssociationIndex(path + "/GEXP_CLIN_association_index.tsv", "GEXP_CLIN", association_index_out)
	if (os.path.exists(path + "/GEXP_CNVR_association_index.tsv")):
		subprocessAssociationIndex(path + "/GEXP_CNVR_association_index.tsv", "GEXP_CNVR", association_index_out) 
	if (os.path.exists(path + "/GEXP_GNAB_association_index.tsv")):
		subprocessAssociationIndex(path + "/GEXP_GNAB_association_index.tsv", "GEXP_GNAB", association_index_out)
	if (os.path.exists(path + "/GEXP_METH_association_index.tsv")):
		subprocessAssociationIndex(path + "/GEXP_METH_association_index.tsv", "GEXP_METH", association_index_out)
	if (os.path.exists(path + "/GEXP_MIRN_association_index.tsv")):
		subprocessAssociationIndex(path + "/GEXP_MIRN_association_index.tsv", "GEXP_MIRN", association_index_out)
	if (os.path.exists(path + "/GEXP_SAMP_association_index.tsv")):
		subprocessAssociationIndex(path + "/GEXP_SAMP_association_index.tsv", "GEXP_SAMP", association_index_out)
	
	association_index_out.close()
	association_index_sh.write("#!/bin/bash\n")
        association_index_sh.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
        association_index_sh.write("load data local infile '" + association_index_out.name + "' replace INTO TABLE " + association_index_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';")
        association_index_sh.write("\ncommit;")
        association_index_sh.write("\nEOFMYSQL")
        association_index_sh.close()
	os.system("sh " + association_index_sh.name)

if __name__ == "__main__":
	global datast_label
	print "Parsing features kicked off %s" %time.ctime()
	if (len(sys.argv) < 3):
        	print 'Usage is py2.6 parse_features_rfex.py data_matrix.tsv dataset_label'
        	sys.exit(1)
	dataset_label = sys.argv[2]
	
	print "\nin parse_features_rfex : dataset_label = <%s>\n" % dataset_label
	configfile = sys.argv[3]
	config = db_util.getConfig(configfile)
	sh = process_feature_matrix(dataset_label, sys.argv[1], 1, config)	
	os.system("sh " + sh.name)
	path = sys.argv[2].rsplit("/", 1)[0] 
	if (os.path.exists(path + "/GEXP_interestingness.tsv")):
		sh = process_gexp_interest_score(path + "/GEXP_interestingness.tsv", configfile)	
		os.system("sh " + sh.name)
	if (os.path.exists(path + "/gsea_associations.tsv")):
		sh = process_pathway_associations(path + "/gsea_associations.tsv", configfile)
		os.system("sh " + sh.name)
	processGeneAssociation(path,configfile)		
	print "Done with processing feature relating loads %s " %(time.ctime())

