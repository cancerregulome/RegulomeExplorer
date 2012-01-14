#!/usr/bin/python
"""
Utility class for configuration loading and mysql updates
"""
import sys
import numpy as np
import pyentropy as pe
import ConfigParser
import MySQLdb

config = ConfigParser.RawConfigParser()
config.read('./rfex_sql.config')
myhost = config.get("mysql_configs", "host")
mydb = config.get("mysql_configs", "db")
myuser = config.get("mysql_configs", "username")
mypw = config.get("mysql_configs", "password")

nucleotide_complement = {}
nucleotide_complement['A'] = 'T'
nucleotide_complement['C'] = 'G'
nucleotide_complement['G'] = 'C'
nucleotide_complement['T'] = 'A'

cancer_type_list = config.get("cancer_types", "list").split(",")

conn = MySQLdb.connect (host = myhost,
                           user = myuser,
                           passwd = mypw,
                           db = mydb)
cursor = conn.cursor()

def getDBHost():
	return myhost

def getDBSchema():
	return mydb

def getDBUser():
	return myuser

def getDBPassword():
	return mypw

def executeInsert(sqlStr):
	rc = cursor.execute(sqlStr)
	#print "executed %s rc %i" %(sqlStr, rc)
	return rc

def executeSelect(sqlStr):
	pass

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

def getYPGKey(name):
	return kruglyak_ypg_hash.get(name)
		
def isAntisense(gene):
	return antisense_genes_hash.get(gene)

def calculateMutualInformation(feature1values, feature2values, range1, range2):
	s = pe.DiscreteSystem(feature1values, range1, feature2values, range2)
	s.calculate_entropies(method='plugin', calc=['HX','HXY'])
	return s.I()

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
		
if __name__ == "__main__":
	#gene = sys.argv[1]
	#print transGeneFeature(gene)
	#print transComplement(sys.argv[1])
	x = np.random.random_integers(0,100,10000)
	y = np.random.random_integers(0,100,10000)
	print(calculateMutualInformation(x,y,(1,101),(1,101)))
