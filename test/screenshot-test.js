var require = patchRequire(require),
    fs = require( "fs" ),    
    basePath = fs.absolute( fs.workingDirectory ),
    testPath = basePath + "/test/html/",
    phantomcss = require( basePath + "/node_modules/phantomcss/phantomcss" ); // casper magix
// if anyone knows how to fix this for casperjs, feel free to remove the hard coded lib path


function screenshotAndCompareFn( relativePath ) {

    casper.test.begin( "Testing" + relativePath, function() {

        console.log("Processing with path:", relativePath);

        phantomcss.update( {
            rebase: casper.cli.get( "rebase" ),
            casper: casper,

            libraryRoot: basePath + "/node_modules/phantomcss",
            screenshotRoot: basePath + "/screenshots" ,
            failedComparisonsRoot: basePath + "/screenshots/failed",

            addLabelToFailedImage: false
        });

        casper.start( testPath + relativePath ); // points to the html file
        casper.viewport( 1024, 768 );

        casper.then( screenShotBody );    

        casper.then( compareScreenShots );

        casper.run( function() {
            console.log(" Finished running tests for", relativePath);
            casper.test.done();
        });

        function compareScreenShots() {
            phantomcss.compareSession();
        }

        function screenShotBody() {
            phantomcss.screenshot('body', relativePath ); // name of screenshot
        }

    });
}


function testRecursive( path ) {
    var fileList = fs.list( testPath + path ),
        targetFile,
        targetPath,
        i;    

    for( i =0; i < fileList.length; i++ ) {
        targetFile = fileList[i];

        if ( targetFile != "." && targetFile != ".." ) {
            targetPath = path + targetFile;

            if( fs.isDirectory( testPath + targetPath ) ) {
                testRecursive( targetPath + "/" );
            } else {
                console.log( "Queued:", targetPath);
                screenshotAndCompareFn( targetPath );
            }
        }
    }
}

testRecursive( "" );

