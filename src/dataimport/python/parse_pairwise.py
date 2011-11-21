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
import getPairwiseInfo

config = ConfigParser.RawConfigParser()
config.read('./rfex_sql.config')
results_path = config.get("results", "path")
contacts = config.get("results", "pubcrawl_contact").split(',')

features_hash = {}
edges_hash = {}
gene_interesting_hash = {}
dataset_label = ""
feature_table = ""
sample_table = ""
#edge_table_label = "tcga.brca_pairwise_associations_0924"
#feature_table_label = "tcga.brca_pairwise_features_0924"
def is_numeric(val):
	try:
		float(val)
	except ValueError, e:
		return False
	return True

if (not os.path.exists("./results")):
	os.system("mkdir results")

def reset_sql_tables(sqlfile):
	"""
        mysql -uvisquick_rw -pr34dwr1t3 < $sql_file
        """
        cmd = "mysql -uvisquick_rw -pr34dwr1t3 < %s" %(sqlfile)
        print "Running system call %s" %(cmd)
        os.system(cmd)

def process_feature_alias(alias):
	data = alias.split(':')
	if len(data) > 4 and len(data[3]) > 3:
		data[3] = data[3][3:]
	return data

def process_feature_matrix(matrix_file, label):
	global features_hash, dataset_label
	feature_matrix_file = open(matrix_file)
	feature_table = "tcga." + label + "_features"  
	fshout = open('./results/load_features_' + dataset_label + '.sh','w')
	outfile = open(results_path + "/" + dataset_label + '/features_out_' + dataset_label + '_pw.tsv','w')
	featureId = 0
	for line in feature_matrix_file:
		if (featureId == 0):
			featureId += 1
			continue
		line = line.strip()	
		tokens = line.split('\t')
		if (not features_hash.get(tokens[0])):
			valuesArray = []
			features_hash[tokens[0]] = featureId
			data = tokens[0].split(':')
			label_desc = ""
			if len(data) > 4 and len(data[3]) > 3:
				data[3] = data[3][3:]
			fpv = 0 #float(tokens[1])
			if (len(data) == 8):
				label_desc = data[7]
			floorlogged_pv = 0
			if (fpv != 0):
				floorlogged_pv = -int(math.floor(math.log10(fpv)))
			outfile.write(tokens[0] + "\t" + "\t".join(data) + "\t" + tokens[1] + "\t" + tokens[2] + "\t" + str(floorlogged_pv) + "\n")
		else:
			print "duplicated feature in feature set:" + tokens[0]
		featureId += 1 
	feature_matrix_file.close()
	outfile.close()
	#sampleOutfile.close()
	fshout.write("#!/bin/bash\n")
	fshout.write("mysql --user=%s --password=%s --database=%s<<EOFMYSQL\n" %("visquick_rw", "r34dwr1t3", "tcga"))
	fshout.write("load data local infile '" + outfile.name  + "' replace INTO TABLE " + feature_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	fshout.write("\ncommit;")
	fshout.write("\nEOFMYSQL")
	fshout.close()
	print "processing done, running bulk load feature data to mysql %s" %time.ctime()
	return fshout

"""
Add in flag to indicate whether to call generate tsv file for pubcrawl
"""
def process_feature_edges(pairwised_file, table_name, do_pubcrawl):
	"""
	Include edges where nodes are in original set, direction does not matter so do not populate edge if A->B if B->A are in hash
	Expected tab delimited columns are nodeA nodeB pvalue correlation numNonNA	
	"""
	global features_hash, dataset_label, edges_hash
	edges_file = open(pairwised_file)
	edge_table = table_name 
        efshout = open('./results/load_edges_' + dataset_label + '.sh','w')
        edges_out_re = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_pw_re.tsv','w')
	edges_out_pc = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_pw_pc.tsv','w')
	validEdgeId = 1
	dupeEdges = 0
	totalEdges = 0
	cnan = 0
	pcc = 0
	for line in edges_file:
		totalEdges += 1 
		line = line.strip()
		tokens = line.split('\t')
		if (len(tokens) != 11):
			print "not enough tokens:" + line
			continue
		nodeA = tokens[0]
		nodeA = nodeA.replace('|', '_')
		nodeB = tokens[1]
		nodeB = nodeB.replace('|', '_')
		if (features_hash.get(tokens[0]) and features_hash.get(tokens[1])):
			if (not edges_hash.get(nodeA + "_" + nodeB) and not edges_hash.get(nodeA + "_" + nodeB)):
				edges_hash[nodeA + "_" + nodeB] = validEdgeId
				validEdgeId += 1
				#add edge info into file, tokenized nodeA and nodeB
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
				bonf = tokens[5]
				pv_bonf = tokens[6]
				numnaf1 = tokens[7]
				pvf1 = tokens[8]
				numnaf2 = tokens[9]
				pvf2 = tokens[10]
				edges_out_re.write(nodeA + "\t" + "\t".join(dataA) + "\t" + nodeB + "\t" + "\t".join(dataB) + "\t" + correlation + "\t" + numna + "\t" + pv + "\t" + bonf + "\t" + pv_bonf + "\t" + numnaf1 + "\t" + pvf1 + "\t" + numnaf2 + "\t" + pvf2 + "\n")
				#edges_out_tsv.write(nodeB + "\t" + "\t".join(dataB) + "\t" + nodeA + "\t" + "\t".join(dataA) + "\t" + correlation + "\t" + numna + "\t" + pv + "\t" + numnaf1 + "\t" + pvf1 + "\t" + numnaf2 + "\t" + pvf2 + "\n")
				if (do_pubcrawl == 1):
					#call andrea code
					getPairwiseInfo.processLine(line, edges_out_pc)
					pcc += 1
		else:
			print "duplicated edge:" + nodeA + "_" + nodeB
			dupeEdges += 1
	print "Valid Edges %i Duped %i cNAN %i Total %i " %(validEdgeId-1, dupeEdges, cnan, totalEdges)	
	edges_file.close()
	edges_out_re.close()
	edges_out_pc.close()	
	efshout.write("#!/bin/bash\n")
	efshout.write("mysql --user=%s --password=%s --database=%s<<EOFMYSQL\n" %("visquick_rw", "r34dwr1t3", "tcga"))
	efshout.write("load data local infile '" + edges_out_re.name + "' replace INTO TABLE " + edge_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	efshout.write("\ncommit;")
	efshout.write("\nEOFMYSQL")
	efshout.close()
	if (do_pubcrawl == 1):
		smtp.main("jlin@systemsbiology.net", contacts, "TEST - New Pairwise Associations for PubCrawl", "New pairwise associations ready for PubCrawl load\n" + edges_out_pc.name + "\n" + str(pcc) + " Total Edges\n" + edges_out_re.name + " loaded into RegulomeExplorer, dataset label is " + dataset_label + "_pw \n\n")
	return efshout

def getFeatureId(featureStr):
	global features_hash
        return features_hash.get(featureStr)

def getGeneInterestScore(featureStr):
	global gene_interesting_hash
	return gene_interesting_hash.get(featureStr)

def process_pathway_associations(gsea_file_path):
	global features_hash, dataset_label
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
	gsea_sh.write("mysql --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myuser, mypw, mydb))
	gsea_sh.write("load data local infile '" + gsea_tsv_out.name + "' replace INTO TABLE " + feature_pathways_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';")
	gsea_sh.write("\ncommit;")
	gsea_sh.write("\nEOFMYSQL")
	gsea_sh.close()	
	#os.system("sh " + gsea_sh.name)
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

def main(pw_label, feature_matrix, associations, dopc, insert_features):
	if (not os.path.exists(results_path + "/" + dataset_label)):
		os.mkdir(results_path + "/" + dataset_label)
	features_sh = process_feature_matrix(feature_matrix, dataset_label)
	if (insert_features == 1):
		os.system("sh " + features_sh.name)
	print "Done with processing features, processing edges %s " %(time.ctime())
	edges_sh = process_feature_edges(associations, dataset_label, dopc)
	os.system("sh " + edges_sh.name)
	print "Done with processing pairwise edges %s " %(time.ctime())

if __name__ == "__main__":
	print "Parsing features kicked off %s" %time.ctime()
	#edge_table_label
	if (len(sys.argv) < 5):
        	print 'Usage is py2.6 parse_pairwise.py feature_matrix.tsv edges_matrix.tsv  dataset_label do_pubcrawl[0,1] optional[insert_features]'
        	sys.exit(1)
	insert_features = 0
	dataset_label = sys.argv[3]
	main(dataset_label, sys.argv[1], sys.argv[2], int(sys.argv[4]), insert_features)
	#reset_sql_tables("/proj/ilyalab/jlin/clinical_correlates/reset_tables.sql");
	#features_sh = process_feature_matrix(sys.argv[1], dataset_label)	
	#optionally inserting features matrix
	#if (len(sys.argv) == 5):
	#	os.system("sh " + features_sh.name)
	#print "Done with processing features, processing edges %s " %(time.ctime())
	#edges_sh = process_feature_edges(sys.argv[2], dataset_label)	
	#os.system("sh " + edges_sh.name)
        #print "Done with processing edges %s " %(time.ctime())

