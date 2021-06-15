import {
	FeatureRunner,
	ConsoleReporter,
	awsSdkStepRunners,
	storageStepRunners,
} from '@nordicsemiconductor/e2e-bdd-test-runner'
import * as chalk from 'chalk'
import { firmwareCIStepRunners } from './steps/firmwareCI'
import { getInput } from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

const getRequiredInput = (input: string): string =>
	getInput(input, { required: true })

const deviceId = getRequiredInput('device id')
const accessKeyId = getRequiredInput('aws access key id')
const secretAccessKey = getRequiredInput('aws secret access key')
const region = getRequiredInput('aws region')
const mqttEndpoint = getRequiredInput('broker hostname')
const stackName = getRequiredInput('stack name')
const appVersion = getRequiredInput('app version')
const featureDir = getRequiredInput('feature dir')
const logDir = getRequiredInput('log dir')

const main = async () => {
	const world = {
		region: region,
		mqttEndpoint,
		stackName,
		deviceId,
		awsAccessKeyId: accessKeyId,
		awsSecretAccessKey: secretAccessKey,
		appVersion,
		deviceLog: fs
			.readFileSync(path.resolve(logDir, 'device.log'), 'utf-8')
			.split('\n'),
	}

	console.log(chalk.yellow.bold(' World:'))
	console.log()
	console.log(world)
	console.log()

	const runner = new FeatureRunner<typeof world>(world, {
		dir: featureDir,
		reporters: [
			new ConsoleReporter({
				printResults: true,
				printProgress: true,
				printSummary: true,
			}),
		],
		retry: false,
	})

	try {
		const { success } = await runner
			.addStepRunners(firmwareCIStepRunners())
			.addStepRunners(
				awsSdkStepRunners({
					constructorArgs: {
						__all: {
							region,
						},
						IotData: {
							endpoint: world.mqttEndpoint,
						},
					},
				}),
			)
			.addStepRunners(storageStepRunners())
			.run()
		if (!success) {
			process.exit(1)
		}
		process.exit()
	} catch (error) {
		console.error(chalk.red('Running the features failed!'))
		console.error(error)
		process.exit(1)
	}
}

void main()
