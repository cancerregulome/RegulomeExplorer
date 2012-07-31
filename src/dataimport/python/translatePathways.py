pf = open("./inputs/consolidated_pathway_list.tsv", "r")
out_pf = open("./results/out_pathway_members_list.tsv", "w")
all_members_out_pf = open("./results/out_pathway_all_list.tsv", "w")
shortc = 0
extrac = 0
pc = 0
mc = 0
max = 0
maxs = ""
large_pathways = []
#source pname purl pmembers_list
for l in pf.readlines():
        tk = l.strip().split("\t")
        if (len(tk) < 4):
                shortc = shortc + 1
                continue
        if (len(tk) > 4):
                print "len > 4 " + "\t".join(tk[2:3])
                extrac = extrac + 1
                continue
        members = tk[3]
        mtk = members.split(",")
        if (len(mtk) > max):
                max = len(mtk)
                maxs = "\t".join(tk[0:2])
        mc = mc + len(mtk)
        pc = pc + 1
        if (len(mtk) > 250):
                large_pathways.append("\t".join(tk[0:2]))
		continue
	#source = tk[0]
	#pname = tk[1]
	all_members_out_pf.write("\t".join(tk) + "\n")
	for m in mtk:
		out_pf.write("\t".join(tk[0:-1]) + "\t" + m + "\n")
	
#print "\n\nPathways with more than 250 members"
#for p in large_pathways:
#        print p

print "pathways %i large_pathways %i member_avg_ct %i short_tokens %i extra_tokens %i" %(pc, len(large_pathways), mc/pc, shortc, extrac)
pf.close()
out_pf.close()
all_members_out_pf.close()
#print "Biggest pathway " + maxs + " members of " + str(max)


