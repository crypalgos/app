pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yaml'
        IMAGE_NAME = 'crypalgos-app'
    }

    stages {

        stage('Setup Environment') {
            steps {
                script {
                    // Load secret .env file from Jenkins credentials
                    withCredentials([file(credentialsId: 'app_prod_env', variable: 'APP_PROD_ENV_FILE')]) {
                        sh '''
                            cp $APP_PROD_ENV_FILE .env
                            chmod 600 .env
                        '''
                    }

                    // Quick check (safe)
                    sh 'ls -la .env'
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    sh '''
                        docker network create crypalgos-network || true
                        docker compose -f $COMPOSE_FILE up -d --build --remove-orphans
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    sh '''
                        docker image prune -f
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'rm -f .env'
        }
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}
