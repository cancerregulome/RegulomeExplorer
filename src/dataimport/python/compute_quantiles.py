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


def compute_quantiles(afmFile,quantileFile):
	
	afmReader = csv.reader(open(afmFile,'r'), delimiter='\t')
	quantileWriter = csv.writer(open(quantileFile,'w'), delimiter='\t')
	
	quantiles = []
	fullData = []

	linesRead = 0
	linesIncluded = 0
	linesSkipped = 0

	for line in afmReader:

		linesRead = linesRead + 1
		featureID = line[0]

		# Skip nonnumerical and invalid features 
		if featureID[0:2] != 'N:':
			linesSkipped = linesSkipped + 1
			continue
	
		data = [float(x) for x in line[1:] if not isNA(x)]
	
		medianValue = percentile(data,0.5)
	
		fullData.extend(data)
	
		quantiles.append([featureID,medianValue,'NA'])

		linesIncluded = linesIncluded + 1

	

	print "\n",linesRead,"lines read from '",afmFile,"'"
	print " -",linesIncluded,"lines included"
	print " -",linesSkipped,"lines skipped\n"

	if linesIncluded == 0 or len(fullData) == 0:
		print "\nError: no data for computing quantiles"
		print " - make sure the AFM is properly formatted"
		print " - make sure the headers start with an 'N:' (numerical)\n"
		return None

	fullData.sort()

	QT = [fullData[0],percentile(fullData,0.05),percentile(fullData,0.25),percentile(fullData,0.75),percentile(fullData,0.95),fullData[-1]]
    
	for line in quantiles:

		q = line[1]	

		for i in range(0,len(QT)-1):
			if QT[i] <= q and q <= QT[i+1]:
				line[2] = 'Q'+str(i+1)
				break
		
		quantileWriter.writerow(line)

def main(afmFile,quantileFile):
	compute_quantiles(afmFile,quantileFile)

if __name__ == "__main__":
	compute_quantiles(sys.argv[1],sys.argv[2])

