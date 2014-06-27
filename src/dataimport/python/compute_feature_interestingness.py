import csv,sys,re,math
from operator import itemgetter

# Converts p-values to strengths, which at the moment are defined as
# -log10(pvalue)
# NOTE: minus is supposed to make a negative number positive, so
# minus can be replaced with abs to make the logic of the function
# more compact
def convertPValueToStrength(pvalue,isLogged):

    if isLogged:
        return abs(pvalue)
    else:
        return abs(math.log10(pvalue))
        

# Takes 
def addToStrengths(strengths,target,feature,newStrength):

    target_elems = target.split(':')
    feature_elems = feature.split(':')   

    targetType = target_elems[1]
    featureType = feature_elems[1]
    
    if featureType == targetType:
        return
    
    allFeatureTypes.add(featureType)
    
    if strengths.get(target,'NA') == 'NA':
        strengths[target] = {}
    
    if strengths[target].get(featureType,'NA') == 'NA':
        strengths[target][featureType] = newStrength
    else:
        strengths[target][featureType] = max(strengths[target][featureType],newStrength)
        

assert sys.argv[1] != sys.argv[2]

assReader = csv.reader(open(sys.argv[1],'r'),delimiter='\t')
intWriter = csv.writer(open(sys.argv[2],'w'),delimiter='\t')
isLogged = False

if (len(sys.argv) == 4):
    if (sys.argv[3] == 'logged'):
        isLogged = True
    elif (sys.argv[3] == 'unlogged'):
	isLogged = False	

strengths = {}

allFeatureTypes = set()

linesSkipped = 0

for line in assReader:

    if len(line) < 3:
        linesSkipped = linesSkipped + 1
        continue
    
    target,feature,pvalue = line[0:3]

    #isLogged = False
    newStrength = convertPValueToStrength(float(pvalue),isLogged)
            
    addToStrengths(strengths,target,feature,newStrength)
    addToStrengths(strengths,feature,target,newStrength)

            
for target in strengths.keys():
    
    totalStrength = 0.0
    for featureType in strengths[target].keys():
        totalStrength += strengths[target][featureType]
    strengths[target]['INTERESTINGNESS'] = totalStrength


allFeatureTypes = list(allFeatureTypes)
allFeatureTypes.append('INTERESTINGNESS')

outputList = []

for target in strengths.keys():

    strength = strengths[target]
    newLine = [target]
    
    for featureType in allFeatureTypes:
        newLine.append( strength.get(featureType,0.0) )

    outputList.append(newLine)

outputList = sorted(outputList, key=itemgetter(len(allFeatureTypes)), reverse=True)

allFeatureTypes.insert(0,'FEATURE')

intWriter.writerow(allFeatureTypes)

for line in outputList:
    intWriter.writerow(line)


print 'Done:',linesSkipped,'lines skipped','\n',
