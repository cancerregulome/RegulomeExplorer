## sh load_pairwise_associations.sh gbm_0131A_pw \
## 	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.31jan12.noPCT_CNA.hg18.tsv \
## 	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.31jan12.noPCT_CNA.pwpvD 1

## Requires:
##	dataset_label[unique cancer_type_label_desc] 	brca_0914
##	feature_matrix.tsv 				brca.merge.agil.14sep.hg18.tsv
##	pairwise_associations.tsv 			associations.out
##	desc 						"descriptive string"
##	comments 					"extra comments"
##	[optional rfex.config]				./rfex.config

## sh load_pairwise_associations.sh \
## 	brca_her2_02Feb_pw \
##  	/titan/cancerregulome3/TCGA/outputs/brca/brca.merge.02feb.her2.tsv \
##  	/titan/cancerregulome3/TCGA/outputs/brca/brca.02feb.her2.1_01_8_1.pwpv \
##  	"BRCA Her2 subset" \
##  	"59 Her2-classified patients"

## sh load_pairwise_associations.sh \
## 	kirc_06Feb_pw \
## 	/titan/cancerregulome3/TCGA/outputs/kirc/bigMerge.06feb12.hg18.tsv \
##  	/titan/cancerregulome3/TCGA/outputs/kirc/bigMerge.06feb12.pwpv \
##  	"KIRC 06Feb" \
##  	"23761 features x 833 patients, ~5 million significant pairs"

## sh load_pairwise_associations.sh \
##	brca_06Feb_all_pw \
##	/titan/cancerregulome3/TCGA/outputs/brca/brca.merge.06feb.hg18.tsv \
## 	/titan/cancerregulome3/TCGA/outputs/brca/brca.06feb.all.05_001_8_1.pwpv \
## 	"BRCA 06Feb all" \
## 	"23742 features x 833 patients, ~9 million significant pairs"

## sh load_pairwise_associations.sh \
##	brca_06Feb_basal_pw \
##	/titan/cancerregulome3/TCGA/outputs/brca/brca.06feb.basal.tsv \
## 	/titan/cancerregulome3/TCGA/outputs/brca/brca.06feb.basal.1_01_8_1.pwpv \
## 	"BRCA 06Feb basal" \
## 	"23742 features x 99 patients, ~315,000 significant pairs"

## sh load_pairwise_associations.sh \
##	brca_06Feb_lumAB_pw \
##	/titan/cancerregulome3/TCGA/outputs/brca/brca.06feb.lumAB.tsv \
## 	/titan/cancerregulome3/TCGA/outputs/brca/brca.06feb.lumAB.1_01_8_1.pwpv \
## 	"BRCA 06Feb lumAB" \
## 	"23742 features x 368 patients, ~3.4 million significant pairs"

## sh load_sandbox_pairwise_associations.sh \
## 	gbm_06feb_neura_pw \
## 	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.neura.tsv \
##  	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.neura.1e02_1e06_8_0.pwpv \
##  	"GBM 06Feb neural" \
##  	"96 patients, 17k features, 31% NA, ~565k pairs"


## sh load_sandbox_pairwise_associations.sh \
##	gbm_06feb_prone_pw \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.prone.tsv \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.prone.1e02_1e06_8_0.pwpv \
##	"GBM 06Feb proneural" \
##	"141 patients, 17k features, 27% NA, ~2.6M pairs"


## sh load_sandbox_pairwise_associations.sh \
##	gbm_06feb_mesen_pw \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.mesen.tsv \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.mesen.1e02_1e06_8_0.pwpv \
##	"GBM 06Feb mesenchymal" \
##	"160 patients, 17k features, 26% NA, ~1.4M pairs"


## sh load_sandbox_pairwise_associations.sh \
##	gbm_06feb_class_pw \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.class.tsv \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.class.1e02_1e06_8_0.pwpv \
##	"GBM 06Feb classical" \
##	"147 patients, 17k features, 28% NA, ~1M pairs"


## sh load_sandbox_pairwise_associations.sh \
##	gbm_06feb_all_pw \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.hg18.tsv \
##	/titan/cancerregulome3/TCGA/outputs/gbm/bigMerge.06feb12.1e04_1e08_8_0.pwpv \
##	"GBM 06Feb all" \
##	"600 patients, 17k features, 30% NA, ~7.3M pairs"


sh load_sandbox_pairwise_associations.sh \
	brca_basal_08feb_pw \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.basal.tsv \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.basal.1_01_8_1.pwpv \
  	"BRCA Basal subset" \
  	"99 Basal-classified patients"

sh load_sandbox_pairwise_associations.sh \
	brca_her2_08feb_pw \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.her2.tsv \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.her2.1_01_8_1.pwpv \
  	"BRCA Her2 subset" \
  	"58 Her2-classified patients"

sh load_sandbox_pairwise_associations.sh \
	brca_lumAB_08feb_pw \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.lumAB.tsv \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.lumAB.1_01_8_1.pwpv \
  	"BRCA LumA/B subset" \
  	"368 LumA/B-classified patients"

sh load_sandbox_pairwise_associations.sh \
	brca_lumA_08feb_pw \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.lumA.tsv \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.lumA.1_01_8_1.pwpv \
  	"BRCA LumA subset" \
  	"235 LumA-classified patients"

sh load_sandbox_pairwise_associations.sh \
	brca_lumB_08feb_pw \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.lumB.tsv \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.lumB.1_01_8_1.pwpv \
  	"BRCA LumB subset" \
  	"235 LumB-classified patients"

sh load_sandbox_pairwise_associations.sh \
	brca_NONbasal_08feb_pw \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.NONbasal.tsv \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.NONbasal.1_01_8_1.pwpv \
  	"BRCA non-basal subset" \
  	"434 non-Basal patients"

sh load_sandbox_pairwise_associations.sh \
	brca_all_08feb_pw \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.merge.08feb.hg18.tsv \
  	/titan/cancerregulome3/TCGA/outputs/brca/brca.08feb.all.05_001_8_1.pwpv \
  	"all available data" \
  	"833 non-Basal patients"

