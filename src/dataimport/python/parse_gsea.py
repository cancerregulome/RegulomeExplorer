#!/usr/bin/python

fin = open('crad_imputed_hg18coords_gsea_finalC.top80.16feb11.tsv','r')
fout = open('top80C_features.tsv','w')
lines = fin.readlines()
fin.close()

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
	print "not a number:" + s
        return False

for line in lines:
	fields=line.split('\t')
	#print fields
	pvalue = '-1'
	if (is_number(fields[1])):
		pvalue = fields[1]
	if (fields[1] == ' NaN'):
		pvalue = '-1'
	lineout =  fields[0] + "\t" + pvalue + "\t" + fields[2] + "\t" + fields[3] + "\t" + fields[4] + "\t" + fields[5]
	fout.write(lineout)

fout.close()

