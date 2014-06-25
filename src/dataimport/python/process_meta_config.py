import os
import sys
import ConfigParser

def loadMetaConfig(metafile):
        metaconfig = ConfigParser.RawConfigParser()
        metaconfig.read(metafile)
        return metaconfig

def getPythonBin(config):
        return config.get("build", "python_bin")

def getFeatureAnnotations(config):
        return config.get("build", "annotations")

def getAssociations(config):
        return config.get("build", "associations")

def getAfm(config):
        return config.get("build", "afm")

def getAfmDescription(config):
        return config.get("build", "afm_description")

def getBuildComment(config):
        return config.get("build", "comment")

def getDatasetLabel(config):
        return config.get("build", "dataset_label")

def getDatasetDate(config):
        return config.get("build", "dataset_date")

def getResultsDir(config):
        return config.get("results", "path")

def getQuantileFeatures(config):
        return config.get("build", "quantile_features")

def getSource(config):
        return config.get("build", "source")

def getContact(config):
        return config.get("build", "contact")

def getDiseaseCode(config):
        return config.get("build", "disease_code")

#dbetl configs
def getPValueTransform(config):
        return config.get("dbetl", "pvalue_transform")

def getCollapseEdgeDirection(config):
        return config.get("dbetl", "collapse_edge_directions")

def getReverseDirection(config):
        return config.get("dbetl", "reverse_directions")

def getKeepUnmapped(config):
        return config.get("dbetl", "keep_unmapped_associations")

def getNotify(config):
	notification_str = config.get("pubcrawl", "notify")
	if (notification_str.find(",") != -1):
        	return notification_str.split(',')
	return notification_str

def getDoPubcrawl(config):
        return config.get("pubcrawl", "dopubcrawl")

def getInterestingScore(config):
        return config.get("build","interesting_scores")

#use Notify
#def getPubcrawlContact(config):
#        return config.get("pubcrawl", "pubcrawl_contact").split(',')

def main(metafile):
	meta_config = loadMetaConfig(metafile)	

if __name__ == "__main__":
        errmsg = "Parameter Error: Data import requires a directory containing a META file"
        if (len(sys.argv) < 2):
                print(errmsg)
                sys.exit(1)
        hasmeta = False
        if (os.path.isfile(sys.argv[1])):
                metafile = sys.argv[1]
        else:
                metadir = os.listdir(sys.argv[1])
                for file in metadir:
                        if (file == "META"):
                                metafile = sys.argv[1] + "/" + file
                                break
        if (hasmeta == False):
                print(errmsg)
                sys.exit(-1)
        main(metafile)

