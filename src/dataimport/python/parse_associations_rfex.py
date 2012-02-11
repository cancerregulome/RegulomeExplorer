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

"""myhost = db_util.getDBHost() 
myport = db_util.getDBPort()
mydb = db_util.getDBSchema() 
myuser = db_util.getDBUser() 
mypw = db_util.getDBPassword() 
"""

args = sys.argv
#add in config for pvalue and importance cutoff
if (len(args) < 5):
	print "Usage is py2.6 parse_associations_rfex.py data_matrix.tsv data_associations.tsv dataset_label configfile"
	sys.exit(-1)

print " "
print " in parse_associations_rfex : args : ", args
print " "

configfile = args[4]
config = db_util.getConfig(configfile)
mydb = db_util.getDBSchema(config) #config.get("mysql_jdbc_configs", "db")
myuser = db_util.getDBUser(config) #config.get("mysql_jdbc_configs", "username")
mypw = db_util.getDBPassword(config) #config.get("mysql_jdbc_configs", "password")
myhost = db_util.getDBHost(config) #config.get("mysql_jdbc_configs", "host")
myport = db_util.getDBPort(config)

results_path = db_util.getResultsPath(config)
contacts = db_util.getNotify(config) 
pubcrawl_contacts = db_util.getPubcrawlContact(config) 

#pvalue_cutoff = float(config.get("cutoff", "pvalue"))
#not filtering on importance or correlation scores for now
#importance = float(config.get("cutoff", "importance"))
#correlation = float(config.get("cutoff", "correlation"))

matrixfile = args[1]
associationsfile = args[2]
if (not os.path.isfile(associationsfile)):
	print associationsfile + " does not exist; unrecoverable ERROR"
	sys.exit(-1)

dataset_label = args[3]
print " "
print " in parse_associations_rfex : dataset_label = <%s> " % dataset_label
print " "

associations_table = mydb + "." + dataset_label + "_networks"
features_table = mydb + "." + dataset_label + "_features"
do_pubcrawl = db_util.getDoPubcrawl(config)

print "Begin processing associations %s Applying processing_pubcrawl %s" %(time.ctime(), do_pubcrawl)
associations_in = open(associationsfile,'r')
matrix_in = open(matrixfile,'r')
featureId = 0

print " in parse_associations_rfex ... calling parse_features_rfex.process_feature_matrix ... <%s> " % dataset_label
parse_features_rfex.process_feature_matrix(dataset_label, matrixfile, 0, configfile)
path = sys.argv[1].rsplit("/", 1)[0]
if (os.path.exists(path + "/GEXP_interestingness.tsv")):
	parse_features_rfex.process_gexp_interest_score(path + "/GEXP_interestingness.tsv")

fshout = open('./results/load_sql_associations_' + dataset_label + '.sh','w')
#check if path exists
if (not os.path.exists(results_path + "/" + dataset_label)):
	os.mkdir(results_path + "/" + dataset_label)

unmappedout = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_rface_unmapped.tsv','w')
tsvout = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_rface_re.tsv','w')
pubcrawl_tsvout = open(results_path + '/' + dataset_label + '/edges_out_' + dataset_label + '_rface_pc.tsv','w')

"""
moved to db_util
def isUnmappedAssociation(f1alias, f2alias):
	f1data = f1alias.split(":")
	if (len(f1data) < 5):
		return False
	f1source = f1data[1]
	f1chr = f1data[3]
	f2data = f2alias.split(":")
	f2source = f2data[1]
	f2chr = f2data[3]
	
	if (f1chr == "" and (f1source != "CLIN" and f1source != "SAMP")):
		if (f2source != "CLIN" and f2source != "SAMP"):
			return True
	if (f2chr == "" and (f2source != "CLIN" and f2source != "SAMP")):
		if (f1source != "CLIN" and f1source != "SAMP"):
			return True
	return False	
"""

lc = 0
pcc = 0
unMapped = 0
pvalueCutCount = 0
lines = associations_in.readlines()
associations_in.close()
for line in lines:
	lc = lc + 1
	columns = line.strip().split('\t')
	if (len(columns) < 5):
		print "missing required tokens in associations lineIndex %i lineValue %s" %(lc, line)
		continue
	f1alias = columns[0]
	f1alias = f1alias.replace('|', '_')
	f2alias = columns[1]
	f2alias = f2alias.replace('|', '_')
	pvalue = columns[2]
	importance = columns[3]
	correlation = columns[4]
	patientct = columns[5]
	if (db_util.isUnmappedAssociation(f1alias, f2alias)):
		unmappedout.write(f1alias + "\t" + f2alias + "\n")
		unMapped += 1
		continue	
	if (not parse_features_rfex.getFeatureId(columns[0])):
		print "feature1 %s not in original feature matrix" %(columns[0])
		continue
	if (not parse_features_rfex.getFeatureId(columns[1])):
		print "feature2 %s not in original feature matrix" %(columns[1])
		continue
	f1genescore = ""
	if (parse_features_rfex.getGeneInterestScore(f1alias) != None):
		f1genescore = parse_features_rfex.getGeneInterestScore(f1alias)	
	f2genescore = ""
	if (parse_features_rfex.getGeneInterestScore(f2alias) != None):
		f2genescore = parse_features_rfex.getGeneInterestScore(f2alias)
	f2data = f2alias.split(':')
	if len(f2data) > 4:
		f2data[3] = f2data[3][3:]
	if len(f2data) == 7:
		f2alias = f2alias + ":"
		f2data.append("")
	if (pvalue == "-inf"):
		pvalue = "-1000"		 
	tsvout.write(str(lc) + "\t" + f1alias + "\t" + f2alias + "\t" + pvalue + "\t" + importance + "\t" + correlation + "\t" + patientct + "\t" + str(parse_features_rfex.getFeatureId(columns[0])) + "\t" + str(parse_features_rfex.getFeatureId(columns[1])) + "\t" + "\t".join(f2data) + "\t" + f1genescore + "\t" + f2genescore + "\n")
	
	if (do_pubcrawl == "yes"):
		getRFACEInfo.processLine(line, pubcrawl_tsvout)
		pcc += 1

fshout.write("#!/bin/bash\n")
fshout.write("mysql -h %s --port %s --user=%s --password=%s --database=%s<<EOFMYSQL\n" %(myhost, myport, myuser, mypw, mydb))
fshout.write("load data local infile '" + tsvout.name + "' replace INTO TABLE " + associations_table + " fields terminated by '\\t' LINES TERMINATED BY '\\n';")
fshout.write("\nEOFMYSQL\n")

tsvout.close()
unmappedout.close()
pubcrawl_tsvout.close()
fshout.close()
print "%i associations filtered because unMapped %i" %(pvalueCutCount, unMapped)
print "Begin bulk upload %s os.system sh %s" %(time.ctime(), fshout.name)
os.system("sh " + fshout.name)
if (do_pubcrawl == 'yes' and db_util.getDoSmtp(config) == 'yes'):
	smtp.main("jlin@systemsbiology.net", pubcrawl_contacts, "Notification - New RFAce " + dataset_label + " Associations for PubCrawl", "New RFAce associations ready for PubCrawl load\n" + pubcrawl_tsvout.name + "\n" + str(pcc) + " Total Edges\n" + tsvout.name + " loaded into RegulomeExplorer, dataset label is " + dataset_label + "\n\n")

print "Done processing associations %s" %(time.ctime())
print "Add notification code to Process Data Set, need to add feature_matrix/associations to comments, add RFAce version, pairwise..."
if (db_util.getDoSmtp(config) == 'yes'):
	smtp.main("jlin@systemsbiology.net", contacts, "Notification - New RFAce " + dataset_label + " Associations Loaded for RegulomeExplorer", "New RFAce associations loaded for dataset " + dataset_label + "\n\nFeature matrix:" + matrixfile + "\nRF Associations:" + associationsfile + "\n\nParsed associations for db:" + tsvout.name + "\n\n" + str(pcc) + " Total Parsed Associations loaded\n" + str(unMapped) + " Total Unmapped Edges saved here:" + unmappedout.name)

