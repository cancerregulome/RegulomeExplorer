#!/usr/bin/python
import db_util
import math
import sys
import os
import time

myhost = db_util.getDBHost() #config.get("mysql_jdbc_configs", "host")
mydb = db_util.getDBSchema() #config.get("mysql_jdbc_configs", "db")
myuser = db_util.getDBUser() #config.get("mysql_jdbc_configs", "username")
mypw = db_util.getDBPassword() #config.get("mysql_jdbc_configs", "password")


print "Parsing samples/patients and values kicked off %s" %time.ctime()
if (len(sys.argv) != 3):
        print 'Usage is py2.6 parse_sample_values.py data_associations.csv dataset_label'
        sys.exit(1)

infile = open(sys.argv[1])
dataset_label = sys.argv[2]
schema = mydb
feature_table = schema + "." + dataset_label + "_features"
samples_table = schema + "." + dataset_label + "_patients"

feature_helper = {}
feature_helper["IMP2"] = "C:GENO:IMP2:chrIX:53981:55021:-"
feature_helper["AAP1"] = "C:GENO:AAP1:chrVIII:198740:201310:-"
features_hash = {}
fshout = open('load_strain_values_' + dataset_label + '.sh','w')
outfile = open('./strain_values_out_' + dataset_label + '.sql','w')
#fshout = open('loadKruglyakValuesSql_pv.sh','w')
#outfile = open('/local/dudley/omics/KruglyakValuesOut_pv.sql','w')
linec = 0
insertStrainsSql = ''
for line in infile:
	line = line.strip()
	if (linec == 0):
		samples = line.replace('\t', ':')
		samplesplt = samples.split(':')
		sampleStr = ""
		for ss in samplesplt:
			sampleDesc = ss
			sampleStr = sampleStr + sampleDesc + ":"
		insertSampleSql= "insert into %s values ('%s');\n" %(samples_table, sampleStr[0:len(sampleStr)-1])
		outfile.write(insertSampleSql)
	else:
		valuesArray = []
		tokens = line.split('\t')
		alias = tokens[0]
		#if (alias.find('PHENO') != -1):
                #	alias = yeast_util.transPhenoFeature(tokens[0])
		#if (alias.find("IMP2") != -1):
		#	alias = yeast_util.transGeneFeature("IMP2")
		#if (alias.find("AAP1") != -1):
		#	alias = yeast_util.transGeneFeature("AAP1")		
		values = ":".join(tokens[1:len(tokens)-1]) 
		for v in tokens[1:len(tokens)-1]:
			if (v != 'NA' and v != 'A' and v != 'B'):
				valuesArray.append(float(v))
		if (alias.find("PROT") != -1):
			#log protein values
			values = ''
			valuesArray = []
			for v in tokens[1:len(tokens)-1]:
				try:
					vf = float(v)
				except ValueError, TypeError:
					values = values + v + ":"				
				else:
					if (float(v) > 0):
						valuesArray.append(math.log(float(v)))
						values = values + str(math.log(float(v))) + ":"
					else:
						values = values + str(0) + ":"
			values = values[0:len(values)-1]
		mean = 0.0
		if (len(valuesArray) > 1):
			mean = sum(valuesArray)/len(valuesArray)		
		outfile.write("update %s set patient_values = '%s', patient_values_mean = %f where alias = '%s';\n" %(feature_table, values, mean,alias))  
	linec = linec + 1
print insertStrainsSql
infile.close()
outfile.close()
fshout.write("#!/bin/bash\n")
#fshout.write("mysql --user=root --database=omics<<EOFMYSQL\n")
fshout.write('mysql -u' + myuser + ' -p'+ mypw + ' < ' + outfile.name + '\n')

#fshout.write("load data local infile '/local/dudley/omics/KruglyakFeaturesOut.tsv' replace INTO TABLE kruglyak_features " + " fields terminated by '\\t' LINES TERMINATED BY '\\n';")
#fshout.write("\nEOFMYSQL")
fshout.close()
print "done parsing %s, running sh %s" %(time.ctime(), fshout.name)
os.system("sh " + fshout.name)
