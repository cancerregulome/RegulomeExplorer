import os
import sys
import time

def main(pvalue, associationsFile, dataset_label):
	print "Kicking off job %s to include records pvalue<%s from %s" %(time.ctime(), pvalue, associationsFile)
	associationOpened = open(associationsFile, 'r')
	associationOut = open(associationsFile.split(".")[0] + '_' + dataset_label +  '_pv_' + pvalue + ".tsv", 'w')
	signiRecs = 0
	for line in associationOpened:
		tokens = line.split('\t')
		if (float(tokens[2]) < float(pvalue)):
			associationOut.write(line)
			signiRecs = signiRecs + 1
	associationOpened.close()
	associationOut.close()
	print "found %i significant records\nsaved results to %s\n job ended at %s" % (signiRecs, associationOut.name, time.ctime()) 

if __name__=="__main__":
	if (len(sys.argv) != 4):
		print 'usage python filterAssociationsByPvalue.py pvalue_cutoff in_assocations.file label'
		sys.exit(1)
	main(sys.argv[1], sys.argv[2], sys.argv[3])
