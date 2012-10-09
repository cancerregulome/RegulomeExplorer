#!/bin/bash
if [ $# -lt 6 ]
then
	echo
        echo "Missing required RE dataimport parameters. Requires dataset_label[unique cancer_type_label_desc] feature_matrix.tsv pairwise_associations.tsv desc comments re_instance[internal,tcga_gdac,public]"
        echo "ie sh start_load_feature_associations.sh brca-nomask_0914 /titan/cancerregulome3/TCGA/outputs/brca/brca.merge.agil.14sep.hg18.tsv /titan/cancerregulome9/workspaces/users/sreynolds/brca/pairwise/associations.out ov_description data_comments public"
        exit
fi

dataset_label=$1
feature_matrix_file=$2
associations_pw=$3
description=$4
comments=$5
re_instance=$6
config_file="none"
if [ $re_instance = "internal" ]
then
	echo "set config file to internal sandbox instance"
	config_file=../config/rfex_sql_sandbox.config
fi

if [ $re_instance = "tcga_gdac" ]
then
        echo "set config file to tcga gdac instance"
        config_file=../config/rfex_sql_gdac.config
fi    

if [ $re_instance = "public" ]
then
        echo "set config file to public instance"
        config_file=../config/rfex_sql.config
fi    

if [ $config_file = "none" ]
then
        echo "required RE instance not set - exiting"
	echo "valid entries are [internal,tcga_gdac,public]"
        exit
fi    

method="pairwise"
echo read in dataimport settings with $config_file $(date) re target instance $re_instance comments $comments desc $description
/tools/bin/python2.7 db_util.py $config_file

echo begin processing $(date) $dataset_label $feature_matrix $associations_file
/tools/bin/python2.7 createSchemaFromTemplate.py $dataset_label ../sql/create_schema_re_template.sql $config_file

echo begin parsing and loading features and sample values $(date) for $feature_matrix_file
/tools/bin/python2.7 parse_features_rfex.py $feature_matrix_file $dataset_label $config_file

#echo begin parsing and loading network relationships
#/tools/bin/python2.7 parse_associations_rfex.py $feature_matrix_file $associations_pw $dataset_label $config_file $method

echo Processing pairwise associations - prepare schema for $dataset_label
/tools/bin/python2.7 createSchemaFromTemplate.py $dataset_label ../sql/create_schema_pairwise_template.sql $config_file

echo begin parsing and loading pairwise data $(date) for $associations_pw
/tools/bin/python2.7 parse_pairwise.py $feature_matrix_file $associations_pw $dataset_label $config_file

/tools/bin/python2.7 update_rgex_dataset.py $dataset_label $feature_matrix_file $associations_pw $method "$description" "$comments" $config_file
echo registered dataset to regulome explorer repository, program done $(date)
echo Done with loading pairwise

