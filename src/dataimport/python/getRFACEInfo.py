#creates output of rface edge values
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getRFACEInfo.py -i inputFile -o fileName";
    print "-i <inputFile> filename that contains input RFACE data";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
    print "Incorrect Arguments."
    usage();

def getNode(featureid):
	featureInfo=featureid.split(":");
	
	if(featureInfo[1].lower()=="gexp" or featureInfo[1].lower() == "meth"):
		return featureInfo[2].lower();
	if(featureInfo[1].lower()=="gnab"):
		index=featureInfo[2].rpartition("_");
		if(index[0]==""):
			return index[2].lower();
		else:
			return index[0].lower();

def processLine(line,outFile):
	rfaceInfo=line.strip().split("\t");      
	sourceNode=getNode(rfaceInfo[1]);
	targetNode=getNode(rfaceInfo[0]);

	if(sourceNode==None or targetNode==None or sourceNode=="" or targetNode==""):
		return;

	if(rfaceInfo[2]=="-inf"):
		pvalue="-1000";
	else:
		pvalue=rfaceInfo[2];
	
	outFile.writelines(sourceNode + "\t" + targetNode + "\t" + rfaceInfo[1] + "\t" + rfaceInfo[0] + "\t" +  pvalue +  "\t" + rfaceInfo[3] + "\t" + rfaceInfo[4] +  "\n");
	return;




if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'i:o:')
    except:
        usage_error();
        exit(1);

    fileString="";
    inputFileString="";
    for option in optlist:
		if(option[0] == '-o'):
			fileString = option[1];
		if(option[0] == '-i'):
			inputFileString = option[1];

		if(fileString=="" or inputFileString==""):
			usage_error();
			exit(1);

    inputFile=open(inputFileString,"r"); 
    outFile=open(fileString+".txt","w");
    outFile.writelines("source\ttarget\tfeatureid1\tfeatureid2\tpvalue\timportance\tcorrelation\n");
    for line in inputFile:
		processLine(line,outFile);
	
    inputFile.close();
    outFile.close();
