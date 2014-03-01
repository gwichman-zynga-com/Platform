module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('./package.json'),

        mochaTest: {
            test: {
                options: {
                    reporter: 'list'
                },
                src: ['test/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.task.registerTask('default', ['mochaTest']);

};
