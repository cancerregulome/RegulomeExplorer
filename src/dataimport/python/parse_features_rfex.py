#!/usr/bin/python
"""
Processing features from in data_matrix and gexp interesting. Sample values and identifiers will also be extracted. 
The required dataset label indicates the set of schemas. 
"""
import db_util
import sys
import os
import time
import compute_quantiles

features_hash = {}
interesting_hash = {}
dataset_label = ""
feature_table = ""
sample_table = ""

if (not os.path.exists("./results")):
	os.system("mkdir results")

#not being used right now
def populate_sample_meta(sampleList, config):
	"""
	sampleList needs to be a list of patients
	"""
	global dataset_label
	labelTokens = dataset_label.split("_")
	cancer_type = labelTokens[0]
	clabel = ""
	samColIndex = 0

	for sam in sampleList:
		#REPLACE INTO `tcga`.`SampleMeta` (sample_key,cancer_type,dataset_label,matrix_col_offset,meta_json) VALUES ('a' /*not nullable*/,'s' /*not nullable*/,'s' /*not nullable*/,0,'s');		
		insertSampleSql = "replace into sample_meta (sample_key,cancer_type,dataset_label,matrix_col_offset,meta_json) values ('%s', '%s', '%s', '%i', '%s');" %(sam, cancer_type,clabel,samColIndex,"{age:X,status:someStatus,comments:some comments}")
		db_util.executeInsert(config, insertSampleSql)
		samColIndex += 1
	print "Done populating sample list for " + dataset_label

def process_feature_annotations(annotation_path):
	print "\nProcessing annotations %s \n" %(annotation_path) 
	annotation_hash = {}
	feature_types = {}	
	if (annotation_path == "" or (not os.path.isfile(annotation_path))):
		print "annotations path %s not defined or not a file " %(annotation_path)
		return (annotation_hash, feature_types)
	anno_file = open(annotation_path, "r")
        #line 1 is headers
	lc = 0
	for l in anno_file.readlines():
		if (lc == 0):
			lc += 1
			continue
		tk = l.strip().split("\t")		
		if (len(tk) >= 4 and len(tk[3]) < 3):
			tk[3] = "chr" + tk[3]		
		annotation_hash[tk[0]] = l[0:1] + "\t" + "\t".join(tk[1:]) + "\t" + str(lc)

		if (feature_types.get(tk[1]) == None):			
			feature_types[tk[1]] = 1;
		lc += 1
	anno_file.close()
	print feature_types
	return (annotation_hash, feature_types)

def accumulate_summary_counts(summary_hash, feature_type):	
	if (summary_hash.get(feature_type) == None):
		summary_hash[feature_type] = 1
	summary_hash[feature_type] = summary_hash[feature_type] + 1 

def get_feature_interest_hash(results_file):
	fIntHash = {}
	if (results_file == ""):
		return fIntHash
	fIntReader = open(results_file, "r")
	# lc = 0
	for line in fIntReader.readlines():
		#if (lc == 0):
		#	lc += 1
		#	continue
		tk = line.strip().split("\t")
		fIntHash[tk[1]] = tk[-1]
	fIntReader.close()
	return fIntHash

def process_feature_matrix(dataset_label, matrix_file, persist_sample_meta, config, annotations, quantileFeatures, results_path, interestingFile):	
	global features_hash
	print ("processing feature set: matrix file %s annotation file %s"%(matrix_file, annotations))
	out_hash = {}
	features_hash = {}
	summary_hash = {}
	mydb = db_util.getDBSchema(config) 
	myuser = db_util.getDBUser(config) 
	mypw = db_util.getDBPassword(config)
	myhost = db_util.getDBHost(config)
	myport = db_util.getDBPort(config)
	if (not os.path.isfile(matrix_file)):
	        print "ERROR\n" + matrix_file + " does not exist; unrecoverable ERROR"
		sys.exit(-1)
	feature_matrix_file = open(matrix_file, "r")
	feature_table = mydb + "." + dataset_label + "_features"
	sample_table = mydb + "." + dataset_label + "_patients"
	fshout = open(results_path + dataset_label + '_load_features.sh','w')
	outfile = open(results_path + dataset_label + '_features_out.tsv','w')
	alidfile = open(results_path + dataset_label + '_features_alias_id.tsv','w')
	sampleOutfile = open(results_path + dataset_label + '_sample_values_out.tsv','w')
	featureId = 0
	annotation_hash, ftypes = process_feature_annotations(annotations)
	sub_afm_out = {}
	for q in quantileFeatures.split(","):
		sub_afm_out[q] = open(results_path + dataset_label + '_' + q + '.afm','w')
	fIntHash = get_feature_interest_hash(interestingFile) 
	for line in feature_matrix_file:
		tokens = line.strip().split('\t')
		afmid = ""
		ftype = ""
		interesting_score = 0
		if (featureId == 0):               
                	sampleIds = tokens
			#not part of core function in RE import pipeline
			#if (persist_sample_meta == 1):
			#	populate_sample_meta(sampleIds.split(":"), config)	
			#sampleOutfile.write(sampleIds + "\n");
			featureId += 1
			continue
		if (not features_hash.get(tokens[0]) and len(tokens[0]) > 1):
			valuesArray = []
			alias = tokens[0]
			originalAFM = tokens[0]
			data = alias.split(':')
			if (len(data) < 4):
				#afmid = alias
				annotated_feature = annotation_hash.get(alias)
				if (annotated_feature == None):
					print "ERROR: AFM feature %s is not in annotation" %(alias)
					sys.exit(-1)
				#hasAnnotations = True
				#put features in sub afm files for quantile calculation
				ftype = annotated_feature.split("\t")[1]
				alias = annotated_feature.replace("\t", ":")
				featureId = int(alias.split(":")[-1])
			data = alias.split(':')
			if (ftype == ""):
				ftype = data[1]
			afmid = alias
			#if (fIntHash[alias] != None):
			try:
				interesting_score = fIntHash[originalAFM]
			except KeyError:
				#print "Key error with fInterestingHash " + alias
				interesting_score = 0
			if (sub_afm_out.get(ftype) != None):
				sub_afm_out[ftype].write(alias + "\t" + "\t".join(tokens[1:]) + "\n")
			features_hash[tokens[0]] = featureId
			if (len(data) <= 7):
				if (data[1] == 'CLIN' or data[1] == 'SAMP'):
					alias = ":".join(data[0:3]) + ":::::"
					data = alias.split(':')
				else:
					data.append("")
			if len(data[3]) > 3:
				data[3] = data[3][3:]
			patient_values = ":".join(tokens[1:])
			for val in tokens[1:]:
				if (db_util.is_numeric(val)):
					valuesArray.append(float(val))
				else:
					valuesArray.append(0.0)
			#make sure that the number patient ids match values
			if (featureId == 1):
				start = len(sampleIds) - len(valuesArray)
				sampleStr = ":".join(sampleIds[start:])
				sampleOutfile.write(sampleStr + "\n");

			patient_value_mean = sum(valuesArray)/len(valuesArray)
			accumulate_summary_counts(summary_hash,data[1])
			alidfile.write(originalAFM + "\t" + str(featureId) + "\t" +  alias + "\n")
			out_hash[afmid] = str(featureId) + "\t" + alias + "\t" + "\t".join(data) + "\t" + patient_values + "\t" + str(patient_value_mean) + "\t" + str(interesting_score)
		else:
			print "duplicated feature in feature set:" + tokens[0]
		featureId += 1
	quantiles_out = {} 
	for ftype in sub_afm_out.keys():
                        sub_afm_out[ftype].close()
			q_out = resultsPath + dataset_label + "_" + ftype + "_qo.tsv"
			#get quantile from timo and add back to alias string and then write
			compute_quantiles.compute_quantiles(sub_afm_out[ftype].name, q_out)
			quantiles_out[ftype] = open(q_out, "r")
			#featureId\tval\tQX
			qdic = {}
			for ql in quantiles_out[ftype].readlines():
				qtk = ql.strip().split("\t")
				afmkey = qtk[0]
				fv = qtk[1]
				fq = qtk[2]
				qdic[afmkey] = fv + "\t" + fq  
				fline = out_hash.get(afmkey)
				if (fline != None):
					out_hash[afmkey] = fline + "\t" + fv + "\t" + fq
	for val in out_hash.values():
		outfile.write(val + "\n")
	summary_out = open(resultsPath + "feature_summary_" + dataset_label + ".json", "w")
	summary_json = "{"

	for feature_type in summary_hash:
		summary_json = summary_json + '"%s":%i,' %(feature_type, summary_hash[feature_type])
	summary_out.write(summary_json[0:-1] + "}\n")
	summary_out.close()
	feature_matrix_file.close()
	outfile.close()
	alidfile.close()
	sampleOutfile.close()
	fshout.write("#!/bin/bash\n")
	fshout.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
	fshout.write("load data local infile '" + outfile.name + "' replace INTO TABLE " + feature_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	fshout.write("load data local infile '" + sampleOutfile.name + "' replace INTO TABLE " + sample_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	fshout.write("\ncommit;\nEOFMYSQL")
	fshout.close()
	print "processing done, running bulk load on %i features  %s" %(len(features_hash), time.ctime())
	if (persist_sample_meta == 1):
		os.system("sh " + fshout.name)
	return annotation_hash

def getFeatures():
	return features_hash

def getFeatureId(featureStr):
        return features_hash.get(featureStr)

if __name__ == "__main__":
	global datast_label
	print "Parsing features kicked off %s" %time.ctime()
	if (len(sys.argv) < 7):
        	print 'Usage is py2.6 parse_features_rfex.py data_matrix.tsv dataset_label configFile annotations quantileFeatures resultsPath'
        	sys.exit(1)
	dataset_label = sys.argv[2]
	print "\nin parse_features_rfex : dataset_label = <%s>\n" % dataset_label
	configfile = sys.argv[3]
	config = db_util.getConfig(configfile)
	annotations = sys.argv[4]
	quantileFeatures = sys.argv[5]
	resultsPath = sys.argv[6]
	featureInterestingFile = ""
	if (len(sys.argv) == 8):
		featureInterestingFile = sys.argv[7]
	process_feature_matrix(dataset_label, sys.argv[1], 1, config, annotations, quantileFeatures, resultsPath, featureInterestingFile)	
	print "Done with processing feature relating loads %s " %(time.ctime())

