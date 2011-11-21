#!/usr/bin/python
import sys
import MySQLdb

conn = MySQLdb.connect (host = "giza",
                           user = "visquick_rw",
                           passwd = "r34dwr1t3",
                           db = "tcga")
cursor = conn.cursor ()

#db = MySQLdb.connect(host="giza",user="visquick_rw",passwd="r34d_wr1t3", db="tcga")
fin = open('crad_imputed_hg18coords_links_finalC.top80.16feb11.tsv','r')
#fout = open('top80_links.tsv','w')
tsvout = open('top80C_filteredlinks1.tsv','w')
#sqlout = open('top80C_links_update.sql','w')
featureid = -1

#select id from coad_read_features_u where alias = 'N:CLIN:preoperative_pretreatment_cea_level::::'
def getFeatureId(alias):
	global featureid
	cursor.execute ("SELECT id FROM tcga.coad_read_features_u WHERE alias = '" + alias + "'")
	#'SELECT VERSION()")
	row = cursor.fetchone ()
	rows = cursor.fetchall ()
	if (cursor.rowcount != 1):
		print alias + " feature id count " + cursor.rowcount
		System.exit(-1) 
	return row[0]

lc = 0
def updateNetworkFeatureIds(updateSql):
        print updateSql
        cursor.execute(updateSql)
        print "line no %d updated: %d" % (lc, cursor.rowcount)

lines = fin.readlines()
fin.close()

for line in lines:
	lc = lc + 1
	columns = line.split('\t')
	f1alias = columns[0]
	f2alias = columns[1]
	metricss=columns[2]
	fields=line.strip().replace('\t',':').replace(':','\t')
	data = fields.split('\t')
	if len(data) > 4 and len(data[3]) > 3:
		data[3] = data[3][3:]		
	if len(data) > 10 and len(data[10]) > 3:
		data[10] = data[10][3:]		
	#fout.write("\t".join(data) + "\n")
	if (f1alias.find("GEXP") == -1 or f2alias.find("GEXP") == -1):
		tsvout.write(f1alias + "\t" + f2alias + "\t" + metricss.split(":")[0] + "\t" + metricss.split(":")[1])

#fout.close()
tsvout.close()
cursor.close()
conn.close()
