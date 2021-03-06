#!/usr/bin/python
"""
Processes associations, assumes that their features have been processed, associations tsv file must be in the format of
feature1\tfeature2\tpvalue\timportance\tcorrelation 
"""
import sys
import db_util
import os
import time
import parse_features_rfex
import smtp
import getRFACEInfo

def process_associations_rfex(dataset_label, matrixfile, associationsfile, config, annotations, collapse_direction, reverse_direction, results_path, pv_lambda, do_pubcrawl, contacts, keep_unmapped, featureInterestingFile):
	mydb = db_util.getDBSchema(config) 
	myuser = db_util.getDBUser(config) 
	mypw = db_util.getDBPassword(config) 
	myhost = db_util.getDBHost(config) 
	myport = db_util.getDBPort(config)
	mysolr = db_util.getSolrPath(config)
	if (not os.path.isfile(associationsfile)):
		print associationsfile + " does not exist; unrecoverable ERROR"
		sys.exit(-1)
	associations_table = mydb + ".mv_" + dataset_label + "_feature_networks"
	print "Begin processing associations %s Applying processing_pubcrawl %s" %(time.ctime(), do_pubcrawl)
	fIntHash = parse_features_rfex.get_feature_interest_hash(featureInterestingFile)

	edges_out_re = open(results_path + 'edges_out_' + dataset_label + '_rface_re.tsv','w')
	associations_in = open(associationsfile,'r')
	annotation_hash, ftype = parse_features_rfex.process_feature_annotations(annotations)
	fshout = open(results_path + 'load_sql_associations_' + dataset_label + '.sh','w')
	solrshout = open(results_path + 'load_solr_assocations_' + dataset_label + '.sh','w')
	unmappedPath = results_path  + 'edges_out_' + dataset_label + '_rface_unmapped.tsv'
	unmappedout = open(unmappedPath,'w')
	features_file = open(results_path + dataset_label + '_features_out.tsv','r')
	features_hash = {}
	for fl in features_file.readlines():
		ftk = fl.strip().split("\t")
		features_hash[ftk[1]] = ftk
	features_file.close()
		
	aliasid_file = open(results_path + dataset_label + '_features_alias_id.tsv','r')
	aliasid_hash = {}
	for fl in aliasid_file.readlines():
		ftk = fl.strip().split("\t")
		aliasid_hash[ftk[0]] = ftk
	aliasid_file.close()	
	
	tsvout = open(results_path + 'edges_out_' + dataset_label + '_rface_re.tsv','w')
	pubcrawl_tsvout = open(results_path + 'edges_out_' + dataset_label + '_rface_pc.tsv','w')
	lc = 0
	edgeCount = 0
	pcc = 0
	unMapped = 0
	pvalueCutCount = 0
	impCut = 0
	lines = associations_in.readlines()
	associations_in.close()
	associations_dic = {}
	for line in lines:
		lc = lc + 1
		columns = line.strip().split('\t')
		if (len(columns) < 5):
			print "Missing required tokens in associations lineIndex %i lineValue %s" %(lc, line)
			continue
		f1alias = columns[0]
		#afm_ids will be used for directionality collapsing, if needed
		f1afm_id = columns[0]
		f2afm_id = columns[1]
		if (len(f1alias.split(":")) < 3):
			annotated_feature = annotation_hash.get(f1alias)
			if (annotated_feature == None):
				print "ERROR: Target feature %s is not in afm/annotation %i" %(f1alias, len(annotation_hash))
				continue
			f1alias = annotated_feature.replace("\t", ":")
		f2alias = columns[1]
		if (len(f2alias.split(":")) < 3):
			annotated_feature = annotation_hash.get(f2alias)
			if (annotated_feature == None):
				print "ERROR: Predictor feature %s is not in afm/annotation" %(f2alias)
				continue
			f2alias = annotated_feature.replace("\t", ":")
		try:
			f1genescore = fIntHash[f1alias]
		except KeyError:
			f1genescore = 0
		try:
			f2genescore = fIntHash[f2alias]
		except KeyError:
			f2genescore = 0
		
		f1data = f1alias.split(':')
		f2data = f2alias.split(':')

		if len(f1data) > 4:
			f1data[3] = f1data[3][3:]
		if len(f2data) > 4:
			f2data[3] = f2data[3][3:]
		
		if (len(f1data) <= 7 and (f1data[1] == 'CLIN' or f1data[1] == 'SAMP')):
			f1alias = ":".join(f1data[0:3]) + ":::::"
			f1data = f1alias.split(':')
		elif (len(f1data) == 7):
			f1data.append("")
		if (len(f2data) <= 7 and (f2data[1] == 'CLIN' or f2data[1] == 'SAMP')):
			f2alias = ":".join(f2data[0:3]) + ":::::"
			f2data = f2alias.split(':')
		elif (len(f2data) == 7):
			f2data.append("") 
		f1aliasOmic = f1alias
		f2aliasOmic = f2alias
		#for annotations
		try:    
			f1id = features_hash[f1alias][0]
		except KeyError:
			try:
				f1id = aliasid_hash[f1alias][1]
				f1aliasOmic = aliasid_hash[f1alias][2]
				f1data = f1aliasOmic.split(':')
				f1data[3] = f1data[3][3:]
			except KeyError:
				print "Skipping Key error with alias1 " + f1alias
                                continue
			
		try:
			f2id = features_hash[f2alias][0]#f2alias.split(":")[-1]
		except KeyError:
			try:
				f2id = aliasid_hash[f2alias][1]
				f2aliasOmic = aliasid_hash[f2alias][2]
				f2data = f2aliasOmic.split(':')
				f2data[3] = f2data[3][3:]	
			except KeyError:
				print "Skipping Key error with alias2 " + f2alias
				continue		

		pvalue = float(columns[2])
		pvalue = str(pv_lambda(pvalue))
		
		importance = columns[3]
		correlation = columns[4]
		patientct = columns[5]
		if (db_util.isUnmappedAssociation(f1alias, f2alias) and keep_unmapped == 0):
			unmappedout.write(f1alias + "\t" + f2alias + "\n")
			unMapped += 1
			continue	
		rhoscore = ""
		link_distance = -1
		if (len(f1data) >=5 and len(f2data)>=5 and db_util.is_numeric(f1data[4]) >= 1 and db_util.is_numeric(f2data[4]) >= 1 and f1data[3] == f2data[3]):
			link_distance = abs(int(f2data[4]) - int(f1data[4]))
		if (collapse_direction == 0):
			associations_dic[f1afm_id + "_" + f2afm_id] = f1aliasOmic + "\t" + f2aliasOmic + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + str(f1genescore) + "\t" + str(f2genescore) + "\t" + rhoscore + "\t" + str(link_distance) + "\n"
		else:
			#check whether (f1 -> f2 or f2 -> f1) exists, if yes, take the more important
			#if not, store pair
			if ((associations_dic.get(f1afm_id + "_" + f2afm_id) == None) and (associations_dic.get(f2afm_id + "_" + f1afm_id) == None)):
				associations_dic[f1afm_id + "_" + f2afm_id] = f1aliasOmic + "\t" + f2aliasOmic + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + str(f1genescore) + "\t" + str(f2genescore) + "\t" + rhoscore + "\t" + str(link_distance) + "\n"
			else:
				existingLink = associations_dic.get(f1afm_id + "_" + f2afm_id)
				ekey = f1afm_id + "_" + f2afm_id
				if (existingLink == None):
					existingLink = associations_dic.get(f2afm_id + "_" + f1afm_id) 
					ekey = f2afm_id + "_" + f1afm_id
				prevImportance = existingLink.split("\t")[3]
				if (float(importance) > float(prevImportance)):
					associations_dic[ekey] = f1aliasOmic + "\t" + f2aliasOmic + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + str(f1genescore) + "\t" + str(f2genescore) + "\t" + rhoscore + "\t" + str(link_distance) + "\n"					 			 
		if (reverse_direction == 1):
			associations_dic[f2afm_id + "_" + f1afm_id] = f2aliasOmic + "\t" + f1aliasOmic + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + str(f2genescore) + "\t" + str(f1genescore) + "\t" + rhoscore + "\t" + str(link_distance) + "\n"
			edgeCount = edgeCount + 1
		edgeCount = edgeCount + 1
		if (do_pubcrawl == "yes"):
			getRFACEInfo.processLine(line, pubcrawl_tsvout)
			pcc += 1
	for ei in associations_dic:
		tsvout.write(associations_dic[ei])
	fshout.write("#!/bin/bash\n")
	fshout.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
	fshout.write("load data local infile '" + tsvout.name + "' replace INTO TABLE " + associations_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';")
	fshout.write("\nEOFMYSQL\n")
	tsvout.close()
	unmappedout.close()
	pubcrawl_tsvout.close()
	fshout.close()
	print "\nReport: ValidEdges %i ImportanceCutoff %i edges filtered %i \nunMapped Edges %i Saved to %s" %(len(associations_dic), impCut, pvalueCutCount, unMapped, unmappedPath)
	print "Begin RF-ACE db bulk upload %s os.system sh %s" %(time.ctime(), fshout.name)
	os.system("sh " + fshout.name)
	solrshout.write("#!/bin/bash\n")
	solrshout.write("python createRFShardedDataset.py " + edges_out_re.name + " " + dataset_label + "\n")
	solrshout.write("curl '" + mysolr + "/core0/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core1/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core2/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core3/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core4/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core5/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core6/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core7/update/?commit=true' -H 'Content-type:text/xml' --data-binary '<delete><query>dataset:\"" + dataset_label + "\"</query></delete>'\n")
	solrshout.write("curl '" + mysolr + "/core0/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core0_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.write("curl '" + mysolr + "/core1/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core1_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.write("curl '" + mysolr + "/core2/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core2_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.write("curl '" + mysolr + "/core3/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core3_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.write("curl '" + mysolr + "/core4/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core4_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.write("curl '" + mysolr + "/core5/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core5_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.write("curl '" + mysolr + "/core6/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core6_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.write("curl '" + mysolr + "/core7/update/csv?commit=true&separator=%09&overwrite=false&escape=\ ' --data-binary @" + edges_out_re.name + "_core7_final.tsv -H 'Content-type:text/plain;charset=utf-8' &\n")
	solrshout.close()
	print "Begin rface solr upload " + time.ctime()
	os.system("sh " + solrshout.name)

	if (do_pubcrawl == 'yes'):
		smtp.main("re@systemsbiology.net", contacts, "Notification - New RFAce " + dataset_label + " Associations for PubCrawl", "New RFAce associations ready for PubCrawl load\n" + pubcrawl_tsvout.name + "\n" + str(pcc) + " Total Edges\n" + tsvout.name + " loaded into RegulomeExplorer, dataset label is " + dataset_label + "\n\n")
	print "Done processing associations %s" %(time.ctime())
	associations_dic = None

def main(dataset_label, featuresfile, associationsfile, configfile, annotations, collapse_direction, reverse_direction, results_path, pvalueRepresentation, do_pubcrawl, contacts, keep_unmapped, featureInterestingFile):
	print "\n in parse_associations_rfex : dataset_label = <%s> \n" % dataset_label
	pvlambda = db_util.reflective
        if (pvalueRepresentation == "negative"):
                pvlambda = db_util.negative
        elif (pvalueRepresentation == "negative_log10"):
                pvlambda = db_util.negative_log10
	elif (pvalueRepresentation == "absolute"):
		pvlambda = db_util.absolute

	process_associations_rfex(dataset_label, featuresfile, associationsfile, config, annotations, collapse_direction, reverse_direction, results_path, pvlambda, do_pubcrawl, contacts, int(keep_unmapped), featureInterestingFile)


if __name__ == "__main__":
	print "Parsing features kicked off %s" %time.ctime()
	if (len(sys.argv) < 13):
		print 'ERROR: Usage is python2.5+ parse_associations_rfex.py feature_matrix.tsv edges_matrix.tsv  dataset_label configfile annotationsFile doCollapseEdges doReverse resultsPath pvalueRepresentation doPubcrawl pubcrawlContact keepUnmapped'
		sys.exit(1)
	insert_features = 0
	args = sys.argv
	matrixfile = args[1]
	associationsfile = args[2]
	dataset_label = sys.argv[3]
	configfile = args[4]
	annotations = args[5]
	collapse_direction = int(args[6])
	reverse_direction = int(args[7])
	results_path = args[8]
	pvalueRep = args[9]
	config = db_util.getConfig(configfile)
	featureInterestingFile = ""
	if (len(args) == 14):
		featureInterestingFile = args[13]
	if (not os.path.isfile(associationsfile)):
		print associationsfile + " does not exist; unrecoverable ERROR"
		sys.exit(-1)
	main(dataset_label, matrixfile, associationsfile, config, annotations, collapse_direction, reverse_direction, results_path, pvalueRep, args[10], args[11], args[12], featureInterestingFile)


