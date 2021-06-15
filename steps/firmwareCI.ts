import {
	regexGroupMatcher,
	StepRunnerFunc,
	InterpolatedStep,
} from '@nordicsemiconductor/e2e-bdd-test-runner'

export const firmwareCIStepRunners = (): ((
	step: InterpolatedStep,
) => StepRunnerFunc<any> | false)[] => [
	regexGroupMatcher<any>(/^the Firmware CI run device log should contain$/)(
		async (_, step, runner) => {
			if (step.interpolatedArgument === undefined) {
				throw new Error('Must provide argument!')
			}
			const expected = step.interpolatedArgument
				.split('\n')
				.map((s) => s.trim())

			const matches = expected.map((e) => ({
				matches: (runner.store.deviceLog as string[]).filter((s) =>
					s.includes(e),
				),
				expected: e,
			}))

			matches.map(({ matches, expected }) => {
				if (matches.length === 0)
					throw new Error(`deviceLog did not contain "${expected}"`)
			})

			return matches.map(({ matches }) => matches).flat()
		},
	),
]
