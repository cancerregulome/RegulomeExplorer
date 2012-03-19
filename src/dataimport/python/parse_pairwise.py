#!/usr/bin/python
"""
Processing features from in data_matrix and gexp interesting. Sample values and identifiers will also be extracted. 
The required dataset label indicates the set of schemas. 
"""
import sys
import os
import time
import math
import ConfigParser
import smtp
import parse_features_rfex
import getPairwiseInfo
import db_util


def process_feature_alias(alias):
	data = alias.split(':')
	if len(data) > 4 and len(data[3]) > 3:
		data[3] = data[3][3:]
	return data

def process_pairwise_edges(dataset_label, matrixfile, pairwised_file, config):
	"""
	Include edges where nodes are in original set, direction does not matter so do not populate edge if A->B if B->A are in hash
	Expected tab delimited columns are nodeA nodeB pvalue correlation numNonNA	
	"""
	edges_hash = {}
	max_pv = -1000.0
	max_pv_corr = -1000.0
	mydb = db_util.getDBSchema(config) #config.get("mysql_jdbc_configs", "db")
	myuser = db_util.getDBUser(config) #config.get("mysql_jdbc_configs", "username")
	mypw = db_util.getDBPassword(config) #config.get("mysql_jdbc_configs", "password")
	myhost = db_util.getDBHost(config)
	myport = db_util.getDBPort(config)
	do_pubcrawl = db_util.getDoPubcrawl(config)
	results_path = db_util.getResultsPath(config)
	edges_file = open(pairwised_file)
	parse_features_rfex.process_feature_matrix(dataset_label, matrixfile, 0, config)
	print "\nBegin processing pairwise edges\n\n"
	edge_table = mydb + ".mv_" + dataset_label + "_feature_networks" 
        efshout = open('./results/load_edges_' + dataset_label + '.sh','w')
        edges_out_re = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_pw_re.tsv','w')
	edges_out_pc = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_pw_pc.tsv','w')
	edges_meta_json = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_meta.json','w')
	unmappedout = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_pw_unmapped.tsv','w')
	validEdgeId = 1
	invalidEdges = 0
	dupeEdges = 0
	totalEdges = 0
	cnan = 0
	pcc = 0
	unMapped = 0
	for line in edges_file:
		totalEdges += 1 
		line = line.strip()
		tokens = line.split('\t')
		if (len(tokens) != 11):
			print "not enough tokens:" + line
			continue
		nodeA = tokens[0]
		nodeB = tokens[1]
		if (db_util.isUnmappedAssociation(nodeA, nodeB)):
	                unmappedout.write(nodeA + "\t" + nodeB + "\n")
        	        unMapped += 1
                	continue
		nodeA = nodeA.replace('|', '_')
		nodeB = nodeB.replace('|', '_')
		if (parse_features_rfex.getFeatureId(tokens[0]) and parse_features_rfex.getFeatureId(tokens[1])):
			if (not edges_hash.get(nodeA + "_" + nodeB) and not edges_hash.get(nodeA + "_" + nodeB)):
				feature1id = str(parse_features_rfex.getFeatureId(tokens[0])) 
				feature2id = str(parse_features_rfex.getFeatureId(tokens[1]))
				edges_hash[nodeA + "_" + nodeB] = validEdgeId
				validEdgeId += 1
				dataA = process_feature_alias(nodeA)
				label1_desc = ""
				dataB = process_feature_alias(nodeB)
				label2_desc = ""
				if (len(dataA) == 7):
					dataA.append("")
					nodeA = nodeA + ":"
				if (len(dataB) == 7):
					dataB.append("")
					nodeB = nodeB + ":"
				correlation = tokens[2]
				if (correlation == 'nan'):
					cnan += 1
					continue
				numna = tokens[3]
				pv = tokens[4]
				if (float(pv) > max_pv):
					max_pv = float(pv)
				bonf = tokens[5]
				pv_bonf = tokens[6]
				if (float(pv_bonf) > max_pv_corr):
					max_pv_corr = float(pv_bonf)
				numnaf1 = tokens[7]
				pvf1 = tokens[8]
				numnaf2 = tokens[9]
				pvf2 = tokens[10]
				rho = str(db_util.sign(float(correlation))*abs(float(pv)))
				edges_out_re.write(feature1id + "\t" + feature2id + "\t" + nodeA + "\t" + "\t".join(dataA) + "\t" + nodeB + "\t" + "\t".join(dataB) + "\t" + correlation + "\t" + numna + "\t" + pv + "\t" + bonf + "\t" + pv_bonf + "\t" + numnaf1 + "\t" + pvf1 + "\t" + numnaf2 + "\t" + pvf2 + "\t" + rho + "\n")
				if (do_pubcrawl == "yes"):
					#call andrea code
					getPairwiseInfo.processLine(line, edges_out_pc)
					pcc += 1
			else:
				print "duplicated edge:" + nodeA + "_" + nodeB
				dupeEdges += 1
		else:
			print "invalid edge:" + nodeA + "_" + nodeB
			invalidEdges += 1
	print "Valid Edges %i Duped %i cNAN %i unMapped %i Total %i max_pvalue %f max_pvalue_corr %f" %(validEdgeId-1, dupeEdges, cnan, unMapped, totalEdges, max_pv, max_pv_corr)	
	edges_meta_json.write('{"max_logpv":%f}' %(max_pv))
	edges_file.close()
	edges_out_re.close()
	edges_out_pc.close()
	edges_meta_json.close()	
	unmappedout.close()
	efshout.write("#!/bin/bash\n")
	efshout.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
	efshout.write("load data local infile '" + edges_out_re.name + "' replace INTO TABLE " + edge_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	efshout.write("\ncommit;")
	efshout.write("\nEOFMYSQL")
	efshout.close()
	if (do_pubcrawl == 1 and db_util.getDoSmtp() == 'yes'):
		smtp.main("jlin@systemsbiology.net", contacts, "Notification - New Pairwise Associations for PubCrawl", "New pairwise associations ready for PubCrawl load\n" + edges_out_pc.name + "\n\n" + str(pcc) + " Total Edges\n\n" + edges_out_re.name + " loaded into RegulomeExplorer, dataset label is " + dataset_label + "_pw \n\n")
	#return efshout
	os.system("sh " + efshout.name)
	if (db_util.getDoSmtp(config) == 'yes'):
		smtp.main("jlin@systemsbiology.net", notify, "Notification - New Pairwise Associations loaded for All Pairs Significance Test", "New pairwise associations loaded into All Pairs Significance Test for " + pw_label + "\n\n" + str(totalEdges) + " Total Edges\n\nFeature matrix file:" + feature_matrix + "\nPairwise associations file:" + associations + "\n")

def main(dataset_label, feature_matrix, associations, configfile, insert_features):
	print "\n in parse_pairwise : dataset_label = <%s> \n" % dataset_label
	config = db_util.getConfig(configfile)
	results_path = db_util.getResultsPath(config)
	notify = db_util.getNotify(config)
	if (not os.path.exists(results_path + "/" + dataset_label)):
		os.mkdir(results_path + "/" + dataset_label)
	#features_sh = process_feature_matrix(feature_matrix, config)
	#if (insert_features == 1):
	#	os.system("sh " + features_sh.name)
	print "Done with processing features, processing pairwise edges %s " %(time.ctime())
	process_pairwise_edges(dataset_label, feature_matrix, associations, config)
	print "Done with processing pairwise edges %s " %(time.ctime())

if __name__ == "__main__":
	print "Parsing features kicked off %s" %time.ctime()
	if (len(sys.argv) < 5):
        	print 'Usage is py2.6 parse_pairwise.py feature_matrix.tsv edges_matrix.tsv  dataset_label configfile optional[insert_features]'
        	sys.exit(1)
	insert_features = 0
	dataset_label = sys.argv[3]
	main(dataset_label, sys.argv[1], sys.argv[2], sys.argv[4], insert_features)

