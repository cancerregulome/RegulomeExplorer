import sys

if(len(sys.argv) < 3):
    print "Incorrect arguments, specify input file,  and dataset name.";
    exit(1);

datasetFile=open(sys.argv[1],"r")
outFile1=open(sys.argv[1] + "_core0_final.tsv","w")
outFile2=open(sys.argv[1] + "_core1_final.tsv","w")
outFile3=open(sys.argv[1] + "_core2_final.tsv","w")
outFile4=open(sys.argv[1] + "_core3_final.tsv","w")
outFile5=open(sys.argv[1] + "_core4_final.tsv","w")
outFile6=open(sys.argv[1] + "_core5_final.tsv","w")
outFile7=open(sys.argv[1] + "_core6_final.tsv","w")
outFile8=open(sys.argv[1] + "_core7_final.tsv","w")
dataset=sys.argv[2]


count=1;
outFile1.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");
outFile2.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");
outFile3.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");
outFile4.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");
outFile5.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");
outFile6.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");
outFile7.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");
outFile8.writelines("feature1id\tfeature2id\talias1\tf1type\tf1source\tf1label\tf1chr\tf1start\tf1end\tf1strand\tf1label_desc\talias2\tf2type\tf2source\tf2label\tf2chr\tf2start\tf2end\tf2strand\tf2label_desc\tcorrelation\tnum_nonna\tlogged_pvalue\tbonf_fac\tlogged_pvalue_bonf\tnum_nonna_f1\tlogged_pvalue_f1\tnum_nonna_f2\tlogged_pvalue_f2\trho_score\tlink_distance\tf1genescore\tf2genescore\tid\tdataset\tdatasetId\n");

numrec=1;
for line in datasetFile:
	if(count==1):
		outFile1.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=count+1;
	elif(count==2):
		outFile2.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=count+1;
	elif(count==3):
		outFile3.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=count+1;
	elif(count==4):
		outFile4.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=count+1;
	elif(count==5):
		outFile5.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=count+1;
	elif(count==6):
		outFile6.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=count+1;
	elif(count==7):
		outFile7.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=count+1;
	elif(count==8):
		outFile8.writelines(line.strip() + "\t" + str(numrec) + "\t" + dataset + "\t" + str(numrec) + "_" + dataset + "\n");
		count=1;
    	
	numrec=numrec+1;

outFile1.close();
outFile2.close();
outFile3.close();
outFile4.close();
outFile5.close();
outFile6.close();
outFile7.close();
outFile8.close();
datasetFile.close();
