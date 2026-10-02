const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const y = d * 365.25;

type Unit =
	| 'Years'
	| 'Year'
	| 'Yrs'
	| 'Yr'
	| 'Y'
	| 'Weeks'
	| 'Week'
	| 'Wks'
	| 'Wk'
	| 'W'
	| 'Days'
	| 'Day'
	| 'D'
	| 'Hours'
	| 'Hour'
	| 'Hrs'
	| 'Hr'
	| 'H'
	| 'Minutes'
	| 'Minute'
	| 'Mins'
	| 'Min'
	| 'M'
	| 'Seconds'
	| 'Second'
	| 'Secs'
	| 'Sec'
	| 'S'
	| 'Milliseconds'
	| 'Millisecond'
	| 'Millisecs'
	| 'Millisec'
	| 'Ms';

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

export type StringValue =
	| `${number}`
	| `${number}${UnitAnyCase}`
	| `${number} ${UnitAnyCase}`;

export function ms(value: StringValue): number {
	if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
		throw new Error('Invalid value');
	}

	const match =
		/^(?<value>-?(?:\d+)?\.?\d+) *(?<type>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
			value,
		);
	const groups = match?.groups as
		| {
				value: string;
				type?: string;
		  }
		| undefined;
	if (!groups) {
		return NaN;
	}

	const num = parseFloat(groups.value);
	const type = (groups.type || 'ms').toLowerCase() as Lowercase<Unit>;

	switch (type) {
		case 'years':
		case 'year':
		case 'yrs':
		case 'yr':
		case 'y':
			return num * y;
		case 'weeks':
		case 'week':
		case 'wks':
		case 'wk':
		case 'w':
			return num * w;
		case 'days':
		case 'day':
		case 'd':
			return num * d;
		case 'hours':
		case 'hour':
		case 'hrs':
		case 'hr':
		case 'h':
			return num * h;
		case 'minutes':
		case 'minute':
		case 'mins':
		case 'min':
		case 'm':
			return num * m;
		case 'seconds':
		case 'second':
		case 'secs':
		case 'sec':
		case 's':
			return num * s;
		case 'milliseconds':
		case 'millisecond':
		case 'millisecs':
		case 'millisec':
		case 'ms':
			return num;
		default:
			throw new Error(
				'Error: единица времени была распознана, но не существует соотвествующего случая. Пожалуйста, проверте введеные данные',
			);
	}
}
