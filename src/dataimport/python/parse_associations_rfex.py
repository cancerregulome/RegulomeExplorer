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
import ConfigParser
import smtp
import getRFACEInfo

def process_associations_rfex(dataset_label, matrixfile, associationsfile, config, annotations, collapse_direction, reverse_direction):
	mydb = db_util.getDBSchema(config) 
	myuser = db_util.getDBUser(config) 
	mypw = db_util.getDBPassword(config) 
	myhost = db_util.getDBHost(config) 
	myport = db_util.getDBPort(config)
	imp_cutoff = db_util.getImportanceCutoff(config)
	results_path = db_util.getResultsPath(config)
	contacts = db_util.getNotify(config) 
	pubcrawl_contacts = db_util.getPubcrawlContact(config) 
	if (not os.path.isfile(associationsfile)):
		print associationsfile + " does not exist; unrecoverable ERROR"
		sys.exit(-1)
	associations_table = mydb + ".mv_" + dataset_label + "_feature_networks"
	do_pubcrawl = db_util.getDoPubcrawl(config)
	print "Begin processing associations %s Applying processing_pubcrawl %s" %(time.ctime(), do_pubcrawl)
	associations_in = open(associationsfile,'r')
	annotation_hash, ftype = parse_features_rfex.process_feature_annotations(annotations)
	fshout = open('./results/load_sql_associations_' + dataset_label + '.sh','w')
	if (not os.path.exists(results_path + "/" + dataset_label)):
		os.mkdir(results_path + "/" + dataset_label)
	unmappedPath = results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_rface_unmapped.tsv'
	unmappedout = open(unmappedPath,'w')
	features_file = open('./results/' + dataset_label + '_features_out.tsv','r')
	features_hash = {}
	for fl in features_file.readlines():
		ftk = fl.strip().split("\t")
		features_hash[ftk[1]] = ftk
	features_file.close()
	tsvout = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_rface_re.tsv','w')
	pubcrawl_tsvout = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_rface_pc.tsv','w')
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
		#f1alias = f1alias.replace('|', '_')
		#f2alias = f2alias.replace('|', '_')
		f1data = f1alias.split(':')
                f2data = f2alias.split(':')
		"""if len(f1data) == 7:
                        f1alias = f1alias + ":"
                        f1data.append("")
		
                if len(f2data) == 7:
                        f2alias = f2alias + ":"
                        f2data.append("")
		"""
		if len(f1data) > 4:
			f1data[3] = f1data[3][3:]
		#else:
 		#	f1alias = ":".join(f1data) + ":::::"
		if len(f2data) > 4:
			f2data[3] = f2data[3][3:]
 		#else:
		#	f2alias = ":".join(f2data) + ":::::"
		
		if (len(f1data) <= 7 and (f1data[1] == 'CLIN' or f1data[1] == 'SAMP')):
			#if (f1data[1] == 'CLIN' or f1data[1] == 'SAMP'):
			f1alias = ":".join(f1data[0:3]) + ":::::"
			f1data = f1alias.split(':')
		elif (len(f1data) == 7):
			f1data.append("")
		if (len(f2data) <= 7 and (f2data[1] == 'CLIN' or f2data[1] == 'SAMP')):
			#if (f2data[1] == 'CLIN' or f2data[1] == 'SAMP'):
			f2alias = ":".join(f2data[0:3]) + ":::::"
			f2data = f2alias.split(':')
		elif (len(f2data) == 7):
			f2data.append("") 
                    
		f1id = features_hash[f1alias][0]#f1alias.split(":")[-1]
		f2id = features_hash[f2alias][0]#f2alias.split(":")[-1]
		f1qtinfo = ""
		if (features_hash.get(f1alias) != None and len(features_hash.get(f1alias)) >= 14 ):
			f1qtinfo = features_hash.get(f1alias)[13] + "_" + features_hash.get(f1alias)[14]		
		f2qtinfo = ""
		if (features_hash.get(f2alias) != None and len(features_hash.get(f2alias)) >= 14):
			f2qtinfo = features_hash.get(f2alias)[13] + "_" + features_hash.get(f2alias)[14]		
		pvalue = columns[2]
		importance = columns[3]
		correlation = columns[4]
		patientct = columns[5]
		if (db_util.isUnmappedAssociation(f1alias, f2alias)):
			unmappedout.write(f1alias + "\t" + f2alias + "\n")
			unMapped += 1
			continue	
		f1genescore = ""
		f2genescore = ""
		
		if (collapse_direction == 0):
			associations_dic[f1afm_id + "_" + f2afm_id] = f1alias + "\t" + f2alias + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + f1genescore + "\t" + f2genescore + "\t" + f1qtinfo + "\t" + f2qtinfo + "\n"
		else:
			#check whether (f1 -> f2 or f2 -> f1) exists, if yes, take the more important
			#if not, store pair
			if ((associations_dic.get(f1afm_id + "_" + f2afm_id) == None) and (associations_dic.get(f2afm_id + "_" + f1afm_id) == None)):
				associations_dic[f1afm_id + "_" + f2afm_id] = f1alias + "\t" + f2alias + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + f1genescore + "\t" + f2genescore + "\t" + f1qtinfo + "\t" + f2qtinfo + "\n"
			else:
				existingLink = associations_dic.get(f1afm_id + "_" + f2afm_id)
				ekey = f1afm_id + "_" + f2afm_id
				if (existingLink == None):
					existingLink = associations_dic.get(f2afm_id + "_" + f1afm_id) 
					ekey = f2afm_id + "_" + f1afm_id
				prevImportance = existingLink.split("\t")[3]
				if (float(importance) > float(prevImportance)):
					associations_dic[ekey] = f1alias + "\t" + f2alias + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + f1genescore + "\t" + f2genescore + "\t" + f1qtinfo + "\t" + f2qtinfo + "\n"					 			 
		#tsvout.write(f1alias + "\t" + f2alias + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + str(parse_features_rfex.getFeatureId(columns[0])) + "\t" + "\t".join(f1data) + "\t" + str(parse_features_rfex.getFeatureId(columns[1])) + "\t" + "\t".join(f2data) + "\t" + f1genescore + "\t" + f2genescore + "\n")
		if (reverse_direction == 1):
			associations_dic[f2afm_id + "_" + f1afm_id] = f2alias + "\t" + f1alias + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + f2id + "\t" + "\t".join(f2data) + "\t" + f1id + "\t" + "\t".join(f1data) + "\t" + f2genescore + "\t" + f1genescore + "\t" + f2qtinfo + "\t" + f1qtinfo + "\n"
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
	print "Begin bulk upload %s os.system sh %s" %(time.ctime(), fshout.name)
	os.system("sh " + fshout.name)
	if (do_pubcrawl == 'yes' and db_util.getDoSmtp(config) == 'yes'):
		smtp.main("jlin@systemsbiology.net", pubcrawl_contacts, "Notification - New RFAce " + dataset_label + " Associations for PubCrawl", "New RFAce associations ready for PubCrawl load\n" + pubcrawl_tsvout.name + "\n" + str(pcc) + " Total Edges\n" + tsvout.name + " loaded into RegulomeExplorer, dataset label is " + dataset_label + "\n\n")
	print "Done processing associations %s" %(time.ctime())
	if (db_util.getDoSmtp(config) == 'yes'):
		smtp.main("jlin@systemsbiology.net", contacts, "Notification - New RFAce " + dataset_label + " Associations Loaded for RegulomeExplorer", "New RFAce associations loaded for dataset " + dataset_label + "\n\nFeature matrix:" + matrixfile + "\nRF Associations:" + associationsfile + "\n\nParsed associations for db:" + tsvout.name + "\n\n" + str(pcc) + " Total Parsed Associations loaded\n" + str(unMapped) + " Total Unmapped Edges saved here:" + unmappedout.name)
	associations_dic = None

def main(dataset_label, featuresfile, associationsfile, configfile, annotations, collapse_direction, reverse_direction):
	print "\n in parse_associations_rfex : dataset_label = <%s> \n" % dataset_label
	#config = db_util.getConfig(configfile)
	notify = db_util.getNotify(config)
	process_associations_rfex(dataset_label, featuresfile, associationsfile, config, annotations, collapse_direction, reverse_direction)


if __name__ == "__main__":
	print "Parsing features kicked off %s" %time.ctime()
	if (len(sys.argv) < 5):
		print 'Usage is py2.6 parse_associations_rfex.py feature_matrix.tsv edges_matrix.tsv  dataset_label configfile [annotationsFile] [doCollapseEdges]'
		sys.exit(1)
	insert_features = 0
	args = sys.argv
	matrixfile = args[1]
	associationsfile = args[2]
	dataset_label = sys.argv[3]
	configfile = args[4]
	#annotations = ""
	#if (len(sys.argv) == 6):
	annotations = args[5]
	#collapse_direction = 0
	#if (len(sys.argv) == 7):
	#annotations = args[5]
	collapse_direction = int(args[6])
	reverse_direction = int(args[7])
	#if (len(sys.argv) == 8):
		
	#check if it's pairwise workflow
	config = db_util.getConfig(configfile)
	if (not os.path.isfile(associationsfile)):
        	print associationsfile + " does not exist; unrecoverable ERROR"
		sys.exit(-1)
	main(dataset_label, matrixfile, associationsfile, config, annotations, collapse_direction, reverse_direction)


