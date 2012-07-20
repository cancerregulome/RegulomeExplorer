import csv,sys,math

NAs = ["na","nan","?",""]


def percentile(N, percent, key=lambda x:x):
    """
    Find the percentile of a list of values.
    
    @parameter N - is a list of values. Note N MUST BE already sorted.
    @parameter percent - a float value from 0.0 to 1.0.
    @parameter key - optional key function to compute value from each element of N.
    
    @return - the percentile of the values
    """

    if not N:
        return None

    k = (len(N)-1) * percent
    f = math.floor(k)
    c = math.ceil(k)

    if f == c:
        return key(N[int(k)])

    d0 = key(N[int(f)]) * (c-k)
    d1 = key(N[int(c)]) * (k-f)

    return d0+d1


def isNA(x):
    return x.lower() in NAs


assert sys.argv[1] != sys.argv[2] != sys.argv[3] != sys.argv[4]

afmFile = sys.argv[1]
annotationFile = sys.argv[2]
validFeatureType = sys.argv[3]
quantileFile = sys.argv[4]

annotationReader = csv.reader(open(annotationFile,'r'), delimiter='\t')
afmReader = csv.reader(open(afmFile,'r'), delimiter='\t')
quantileWriter = csv.writer(open(quantileFile,'w'), delimiter='\t')

afmReader.next()

validFeatureIDsAsSet = set()

# First we read all the annotations
for line in annotationReader:
	
	featureID,featureType = line[0],line[1]
	
	if featureType == validFeatureType:
		validFeatureIDsAsSet.add(featureID)

fullData = []

validFeatureIDsAsList = []

quantilesForValidFeatures = []

for line in afmReader:

	featureID = line[0]

	#print featureID,'\n',
	
    # Skip nonnumerical and invalid features 
	if featureID[0] != 'N' or featureID not in validFeatureIDsAsSet:
		continue
	
	data = [float(x) for x in line[1:] if not isNA(x)]
	
	medianValue = percentile(data,0.5)
	
	fullData = fullData + data
	
	quantilesForValidFeatures.append([featureID,medianValue,'NA'])

print fullData

print quantilesForValidFeatures[0:5]

fullData.sort()

QT = [percentile(fullData,0.5),percentile(fullData,0.7),percentile(fullData,0.95)]
    
for line in quantilesForValidFeatures:

	q = line[1]	

	if q < QT[0]:
		line[3] = 'Q1'
	elif QT[0] <= q and q < QT[1]:
		line[3] = 'Q2'
	elif QT[1] <= q and q < QT[2]:
		line[3] = 'Q3'
	else: 
		line[3] = 'Q4'
 
	quantileWriter.writerow(line)

