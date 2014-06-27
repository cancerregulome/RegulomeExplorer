#!/usr/bin/python
"""
Processing features from in data_matrix and gexp interesting. Sample values and identifiers will also be extracted. 
The required dataset label indicates the set of schemas. 
"""
import sys
import os
import time
import math
import decimal
import db_util

mydb = db_util.getDBSchema() #config.get("mysql_jdbc_configs", "db")
myuser = db_util.getDBUser() #config.get("mysql_jdbc_configs", "username")
mypw = db_util.getDBPassword() #config.get("mysql_jdbc_configs", "password")
myhost = db_util.getDBHost()
myport = db_util.getDBPort()


features_hash = {}
edges_hash = {}
gene_interesting_hash = {}
dataset_label = ""
load_desc = ""
feature_table = ""
sample_table = ""
feature_table_label = "tcga.gbm_pw"
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
        mysql -uuser -ppassword < $sql_file
        """
	cmd = "mysql -h %s --port %s -u%s -p%s < %s" %(myhost, myport, myuser, mypw, sqlfile)
        print "Running system call %s" %(cmd)
        os.system(cmd)

def process_feature_alias(alias):
	data = alias.split(':')
	if len(data) > 4 and len(data[3]) > 3:
		data[3] = data[3][3:]
	return data

def process_feature_aggressiveness(matrix_file, table_name, dognab):
	global features_hash, dataset_label
	feature_matrix_file = open(matrix_file)
	feature_table = table_name 
	fshout = open('./results/load_features_' + dataset_label + '.sh','w')
	outfile = open('./results/features_out_' + dataset_label + '.tsv','w')
	nazfile = open('./results/na_zero_features_aggressiveness.tsv', 'w')
	featureId = 0
	naz = 0
	decimal.getcontext().prec = 3
        decimal.getcontext().rounding = decimal.ROUND_UP
	gnabhash = {}
	if (dognab):
		gnab_file = open("/titan/cancerregulome9/workspaces/users/vthorsson/ClinicalCorrelatesCRC/FeatureLists/06oct.rnaseq/gnabfeats_coords_mapping_file.tsv")
		for line in gnab_file:
			line = line.rstrip()
			gspl = line.split("\t")
			gnabhash[gspl[0]] = gspl[1]
		gnab_file.close()
		print "gnabhash keys %i" %(len(gnabhash))

	for line in feature_matrix_file:
		if (featureId == 0):
			featureId += 1
			continue
		line = line.strip()	
		tokens = line.split('\t')
		if (not features_hash.get(tokens[0])):
			features_hash[tokens[0]] = featureId
			alias = tokens[0]
			data = alias.split(':')
			if ((alias.find(":GNAB:") == 1) and dognab):
				#print "GNAB " + alias
				alias = gnabhash.get(alias)
				data = alias.split(":")
			if len(data) > 4 and len(data[3]) > 3:
				data[3] = data[3][3:]
			#METH, use start pos for end pos
			if (data[1] == "METH"):
				data[5] = data[4]
			
			signed = tokens[2]
			spv = tokens[1]
			floorlogged_pv = 0
			if (signed != "0" and signed != "NA"):
				if (spv == "0"):
					spv = "1e-16"
				fpv = math.log10(float(spv))
				logged_pv = str(decimal.Decimal(str(fpv))*decimal.Decimal("-1") )
				outfile.write(dataset_label + "\t" + alias + "\t" + "\t".join(data) + "\t" + spv + "\t" + tokens[2] + "\t" + logged_pv + "\n")	
			else:
				nazfile.write(line + "\n")
				naz += 1
		else:
			print "duplicated feature in feature set:" + tokens[0]
		featureId += 1 
	feature_matrix_file.close()
	outfile.close()
	fshout.write("#!/bin/bash\n")
	#"mysql -h %s --port %s -u%s -p%s < %s" %(myhost, myport, myuser, mypw, sqlfile)
	fshout.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
	fshout.write("load data local infile '" + './results/features_out_' + dataset_label + '.tsv' + "' replace INTO TABLE " + feature_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	fshout.write("\ncommit;")
	fshout.write("\nEOFMYSQL")
	fshout.close()
	nazfile.close()
	print "processing done, running bulk load feature data to mysql %s" %time.ctime()
	print "found %i na_zero pv, see ./results/na_zero_features_aggressiveness.tsv" %(naz)
	return fshout

def process_feature_edges(pairwised_file, table_name):
	"""
	Include edges where nodes are in original set, direction does not matter so do not populate edge if A->B if B->A are in hash
	Expected tab delimited columns are nodeA nodeB pvalue correlation numNonNA	
	"""
	global features_hash, dataset_label, edges_hash
	circin_file = open(pairwised_file)
	cca_table = table_name 
        efshout = open('./results/load_edges_' + dataset_label + '.sh','w')
        edges_out_tsv = open('./results/edges_out_' + dataset_label + '.tsv','w')
	validEdgeId = 1
	dupeEdges = 0
	totalEdges = 0
	decimal.getcontext().prec = 3
	decimal.getcontext().rounding = decimal.ROUND_UP
	for line in circin_file:
		totalEdges += 1 
		line = line.strip()
		tokens = line.split('\t')
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
				dataB = process_feature_alias(nodeB)
				if (len(dataA) == 7):
					dataA.append("")
					nodeA = nodeA + ":"
				if (len(dataB) == 7):
					dataB.append("")
					nodeB = nodeB + ":"
				pv = tokens[2]
				floorlogged_pv = float(pv[1:len(pv)])
				signval = tokens[3]
				score = str(floorlogged_pv)
				if (signval == '-'):
					score = "-" + score
         	                if (pv != "0" and pv == "NA"):
					fpv = math.log10(float(pv))
					logged_pv = str(decimal.Decimal(str(l))*decimal.Decimal("-1") )
				edges_out_tsv.write(load_desc + "\t" + nodeA + "\t" + "\t".join(dataA) + "\t" + nodeB + "\t" + "\t".join(dataB) + "\t" + score + "\t" + tokens[4] + "\t" + tokens[5] + "\t" + str(logged_pv) + "\t" + signval + "\n")
				edges_out_tsv.write(load_desc + "\t" + nodeB + "\t" + "\t".join(dataB) + "\t" + nodeA + "\t" + "\t".join(dataA) + "\t" + score + "\t" + tokens[4] + "\t" + tokens[5] + "\t" + str(logged_pv) + "\t" + signval + "\n")
		else:
			print "Invalid edge, not found in feature matrix:" + nodeA + "_" + nodeB
			dupeEdges += 1
	print "Valid Edges %i Duped %i Total %i " % (validEdgeId-1, dupeEdges, totalEdges)	
	circin_file.close()
	edges_out_tsv.close()	
	efshout.write("#!/bin/bash\n")
	efshout.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
	efshout.write("load data local infile '" + './results/edges_out_' + dataset_label + '.tsv' + "' replace INTO TABLE " + cca_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';\n")
	efshout.write("\ncommit;")
	efshout.write("\nEOFMYSQL")
	efshout.close()
	return efshout

def getFeatureId(featureStr):
	global features_hash
        return features_hash.get(featureStr)

def getGeneInterestScore(featureStr):
	global gene_interesting_hash
	return gene_interesting_hash.get(featureStr)
 

if __name__ == "__main__":
	print "Parsing features kicked off %s" %time.ctime()
	#edge_table_label
	if (len(sys.argv) < 5):
        	print 'Usage is py2.6 parse_aggressiveness_features.py feature_matrix.tsv edges_matrix.tsv dataset_label desc translategnab(optional)'
        	sys.exit(1)
	translategnab = 0
	if (len(sys.argv) == 6):
		translategnab = 1
	dataset_label = sys.argv[3]
	cctablename = "clinical_correlates_" + dataset_label 
	featuretablename = "clinical_correlates_" + dataset_label
	load_desc = sys.argv[4]
	#reset_sql_tables("../sql/reset_tables.sql");
	features_sh = process_feature_aggressiveness(sys.argv[1], featuretablename, translategnab)	
	os.system("sh " + features_sh.name)
	

