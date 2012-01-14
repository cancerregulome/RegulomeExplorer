#!/bin/bash
if [ $# -lt 4 ]
then
	echo arg length $#
	echo "Requires dataset_label[cancer_type_label_desc] feature_matrix.tsv rface_associations.tsv do_pubcrawl[0,1] [optional pairwise_associations.tsv]"
	echo "ie sh start_load_feature_associations.sh brca-nomask_0914 /titan/cancerregulome3/TCGA/outputs/brca/brca.merge.agil.14sep.hg18.tsv /titan/cancerregulome9/workspaces/users/sreynolds/brca/rfAce.test.01/associations.out 1 /brca/brca_pairwise_associations.tsv"
	echo "update .config file for pvalue and importance cutoff"
	exit
fi
dataset_label=$1
feature_matrix_file=$2
associations_file=$3
do_pubcrawl=$4
method="RF-ACE"

echo begin processing $(date) $dataset_label $feature_matrix $associations_file $do_pubcrawl
/tools/bin/python2.7 createSchemaFromTemplate.py $dataset_label ../sql/create_schema_rfex_template.sql

echo begin parsing and loading features and sample values $(date) for $feature_matrix_file
/tools/bin/python2.7 parse_features_rfex.py $feature_matrix_file $dataset_label

echo parsed and loaded features begin processing associations $(date) for $associations_file
/tools/bin/python2.7 parse_associations_rfex.py $feature_matrix_file $associations_file $dataset_label $do_pubcrawl

echo parsed and loaded associations, create materialized view $(date)
/tools/bin/python2.7 createSchemaFromTemplate.py $dataset_label ../sql/populate_mv_rf_associations_template.sql
echo populated materialize view $(date)

/tools/bin/python2.7 update_rgex_dataset.py $dataset_label $feature_matrix_file $associations_file $method
echo registered dataset to regulome explorer repository, program done $(date)

if [ $# -gt 4 ]
then
	echo Processing pairwise associations - prepare schema
	/tools/bin/python2.7 createSchemaFromTemplate.py $dataset_label ../sql/create_schema_pairwise_template.sql
	associations_pw=$5
	method="pairwise"
	echo begin parsing and loading pairwise data $(date) for $associations_pw
	/tools/bin/python2.7 parse_pairwise.py $feature_matrix_file $associations_pw $dataset_label $do_pubcrawl
	dataset_label=$dataset_label"_pw"
	/tools/bin/python2.7 update_rgex_dataset.py $dataset_label $feature_matrix_file $associations_pw $method
	echo registered dataset to regulome explorer repository, program done $(date)
	echo Done with loading pairwise
fi
