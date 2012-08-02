#!/usr/bin/python
import sys
import os
#import time
import timeit
import db_util #
from random import choice
from decimal import *
import numpy


# How many times the query is repeated to get an average reading
CONST_EXEC_TIMES = 2

def getQueryTime( db_cursor, query ):
	# Bind query to timer and make it callable
	timer = timeit.Timer( lambda: db_cursor.execute( query ) )

	# Execute and return average value (seconds)
	return float(timer.timeit( number=CONST_EXEC_TIMES ) / CONST_EXEC_TIMES)
	#return Decimal( str(timer.timeit( number=CONST_EXEC_TIMES ) / CONST_EXEC_TIMES) )


if __name__ == "__main__":
	if( len(sys.argv) < 2 or len(sys.argv) > 3):
		print 'Usage is py2.6 get_query_times.py ../config/rfex_sql.config [../config/rfex_sql_random_forest.config]'
		sys.exit(-1)

	getcontext().prec = 6
	configfile = sys.argv[1]
	if(not os.path.isfile(configfile)):
		print "Configuration file " + config + " does not exist, QUIT."
		sys.exit(-1)

	# check the other database as well if two configs are provided:
	if( len(sys.argv) == 3):
		if( os.path.isfile( sys.argv[2] ) ): # config for random_forest
			config_random = db_util.getConfig( sys.argv[2] )
			cursor_random = db_util.getCursor( config_random )

			# Disable caching the results during timing
			cursor_random.execute( "SET SESSION query_cache_type = OFF;")

			queries = []
			queries.append( "SELECT pname, pmembers, purl, psource FROM pathways ORDER BY pname;" )
			queries.append( "SELECT chr_name, chr_length FROM chrom_info;" )

			print "random_forest: "
			for query in queries:
				time = getQueryTime( cursor_random, query )
				print( "Query %s took %.8f seconds") %(query, time)
				#print( "Query %s took %s seconds") %(query, str(time))
			print("----------")

			# seems that only cursor at time can open db connection
			cursor_random.close()

		else:
			print "Optional second configuration " + sys.argv[2] + " does not exist, QUIT."
			sys.exit(-1) 


	config = db_util.getConfig(configfile)
	cursor = db_util.getCursor(config)

	# Disable caching the results during timing
	cursor.execute( "SET SESSION query_cache_type = OFF;")

	# get all feature networks
	cursor.execute( "show tables like '%feature_networks';" )
	feature_networks = cursor.fetchall()

	f2sources = ['CLIN', 'CNVR', 'GEXP', 'METH']
	for fn in feature_networks:
		cursor.execute("select count(*) from " + fn[0] + ";")
		rows = str( cursor.fetchone()[0] )
		print fn[0] + " (" + rows + " rows):"

		importance = str( choice( numpy.linspace(0.01, 0.5, num=20) ) )
		pvalue = str( choice( numpy.linspace(0.01, 0.95, num=40) ) )
		f2source = str( choice( f2sources ) )

		queries = []
		queries.append( "SELECT count(*) FROM " + fn[0] )
		queries.append( "SELECT alias1, alias2, f1qtinfo, f2qtinfo, importance, pvalue, correlation FROM " + fn[0] + " WHERE f2source = " + "'" + f2source + "'" + " AND importance >= " + importance + " AND pvalue <= " + pvalue + " ORDER BY importance DESC LIMIT 500" )

		cursor.execute( "SHOW COLUMNS FROM mv_coadread_quant_0531_feature_networks;" )
		#| Field        | Type         | Null | Key | Default | Extra          |
		columns = cursor.fetchall()

		for column in columns:
			queries.append( "SELECT COUNT(" + column[0] + ") FROM " + fn[0] + ";" )

		for query in queries:
			time = getQueryTime( cursor, query )
			time_select1 = getQueryTime( cursor, query )
			print( "Query %s took %.8f seconds") %(query, time)
		print("-----------------")

	cursor.close()
	sys.exit(0)
