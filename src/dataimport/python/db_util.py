#!/usr/bin/python
"""
Data import configuration and mysql settings
"""
import sys
#import numpy as np
#import pyentropy as pe
import ConfigParser
import MySQLdb
import math

nucleotide_complement = {}
nucleotide_complement['A'] = 'T'
nucleotide_complement['C'] = 'G'
nucleotide_complement['G'] = 'C'
nucleotide_complement['T'] = 'A'

"""
conn = MySQLdb.connect (host = myhost,
			port = myport,
                           user = myuser,
                           passwd = mypw,
                           db = mydb)
cursor = conn.cursor()
"""

def getConfig(path):
	config = ConfigParser.RawConfigParser()
	config.read(path)
	return config

#def getCancerTypes(config):
#	return config.get("cancer_types", "list").split(',')

def getCursor(config):
	conn = MySQLdb.connect (host = getDBHost(config),
                        port = getDBPort(config),
                        user = getDBUser(config),
                        passwd = getDBPassword(config),
                        db = getDBSchema(config))
	return conn.cursor()

def getDBHost(config):
	return config.get("mysql_configs", "host") #myhost

def getDBPort(config):
	return int(config.get("mysql_configs", "port")) #myport

def getDBSchema(config):
	return config.get("mysql_configs", "db")

def getDBUser(config):
	return config.get("mysql_configs", "username")

def getDBPassword(config):
	return config.get("mysql_configs", "password")

"""
def getImportanceCutoff(config):
	return config.getfloat("cutoff", "importance")

def getLoggedPVCutoff(config):
	return config.getint("cutoff", "loggedpvalue")
"""

def getSolrPath(config):
    return config.get("solr_configs","solrpath")

def getDoSmtp(config):
	return config.get("notification", "dosmtp")

def getNotify(config):
	return config.get("notification", "notify").split(',')

def getDoPubcrawl(config):
	return config.get("pubcrawl", "dopubcrawl")

def getPubcrawlContact(config):
	return config.get("pubcrawl", "pubcrawl_contact").split(',')

def executeInsert(config, sqlStr):
	#print sqlStr
	rc = getCursor(config).execute(sqlStr)
	#print "executed %s rc %i" %(sqlStr, rc)
	return rc

def executeSelect(config, sqlStr):
	cursor = getCursor(config)
	rc = cursor.execute(sqlStr)	
	#print "executed %s rc %i" %(sqlStr, rc)
	return cursor.fetchall()

def executeUpdate(sqlStr):
	pass
	
def transGeneFeature(gene):
	return missing_coordinate_hash.get(gene)

def transPhenoFeature(phenoFeature):
	return phenoFeature + '::::'

def transComplement(seq):
	#print seq
        #rev = seq[::-1]
	complement = ''
	for r in seq[::-1]:
		complement = complement + nucleotide_complement.get(r)
	return complement
		
def isAntisense(gene):
	return antisense_genes_hash.get(gene)

def isUnmappedAssociation(f1alias, f2alias):
        """
        Classify edges as unmapped if both nodes do not have chr positions
        """
        f1data = f1alias.split(":")
	f2data = f2alias.split(":")
        if (len(f1data) < 4 or len(f2data) < 4):
		return False
        f1source = f1data[1]
        f1chr = f1data[3]
        f2source = f2data[1]
        f2chr = f2data[3]
	
	if (f1chr == "" and f2chr == ""):
		return True
	
	"""
        if (f1chr == "" and (f1source != "CLIN" and f1source != "SAMP")):
                if (f2source != "CLIN" and f2source != "SAMP"):
                        return True
        if (f2chr == "" and (f2source != "CLIN" and f2source != "SAMP")):
                if (f1source != "CLIN" and f1source != "SAMP"):
                        return True
	"""
        return False


#def calculateMutualInformation(feature1values, feature2values, range1, range2):
#	s = pe.DiscreteSystem(feature1values, range1, feature2values, range2)
#	s.calculate_entropies(method='plugin', calc=['HX','HXY'])
#	return s.I()

def is_numeric(val):
	try:
		float(val)
	except ValueError, e:
		return False        
	return True

"""
def is_numeric(lit):
    'Return value of numeric literal string or ValueError exception'
    # Handle '0'
    if lit == '0': return 0
    # Hex/Binary
    litneg = lit[1:] if lit[0] == '-' else lit
    if litneg[0] == '0':
        if litneg[1] in 'xX':
            return int(lit,16)
        elif litneg[1] in 'bB':
            return int(lit,2)
        else:
            try:
                return int(lit,8)
            except ValueError:
                pass
 
    # Int/Float/Complex
    try:
        return int(lit)
    except ValueError:
        pass
    try:
        return float(lit)
    except ValueError:
        pass
    print lit	
    return -1
"""

#quick function to tell sign of int
sign = lambda x: math.copysign(1, x)

negative = lambda x: -1*(x)
#round(-1*(math.log10(pvalue)),3))
negative_log10 = lambda x: round(-1*(math.log10(x)),3)		
absolute = lambda x: abs(x)
reflective = lambda x: (x)

if __name__ == "__main__":	
	configfile = sys.argv[1]
	config = getConfig(configfile) #config.read(configfile)
	#executeSelect(config, "select * from tcga.regulome_explorer_dataset")	
