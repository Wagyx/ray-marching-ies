import {
	DataTexture,
	FileLoader,
	FloatType,
	RedFormat,
	MathUtils,
	Loader,
	UnsignedByteType,
	LinearFilter,
	HalfFloatType,
	DataUtils
} from 'three';

class IESLoader extends Loader {

	constructor( manager ) {

		super( manager );

		//this.type = UnsignedByteType;
		this.type = HalfFloatType;
		//this.type = FloatType;

	}

	
	_getIESValues( iesLamp, type ) {
		
		function interpolateIntensity(iesLamp) {
			const w = iesLamp.horAngles.length;
			const h = iesLamp.verAngles.length;
			let dAzimuth = 1; //1 degree
			for (let i = 0; i < w - 1; ++i) {
				dAzimuth = Math.min(dAzimuth, iesLamp.horAngles[i + 1] - iesLamp.horAngles[i]);
			}
			let dInclination = 1; //1 degree
			for (let i = 0; i < h - 1; ++i) {
				dInclination = Math.min(dInclination, iesLamp.verAngles[i + 1] - iesLamp.verAngles[i]);
			}
		
			const nAzimuth = Math.round(360.0 / dAzimuth) + 1;
			const nInclination = Math.round(180.0 / dInclination) + 1;
			const intensity = new Array(nAzimuth*nInclination);
			//console.log(""+w+" " +h);
			//console.log(""+nAzimuth+" " +nInclination);
			//console.log(iesLamp.horAngles);
			//console.log(iesLamp.verAngles);
			let iHor = 0;
			for (let i = 0; i < nAzimuth; ++i) {
				const azimuth = i * 360.0 / (nAzimuth - 1);
				while (azimuth > iesLamp.horAngles[iHor + 1]) {
					iHor += 1;
				}
				const alpha = (azimuth - iesLamp.horAngles[iHor]) / (iesLamp.horAngles[iHor + 1] - iesLamp.horAngles[iHor]);
				let iVer = 0;
				// const cut = []
				for (let j = 0; j < nInclination; ++j) {
					const inclination = j * 180.0 / (nInclination - 1);
					while (inclination > iesLamp.verAngles[iVer + 1]) {
						iVer += 1;
					}
					const beta = (inclination - iesLamp.verAngles[iVer]) / (iesLamp.verAngles[iVer + 1] - iesLamp.verAngles[iVer]);
					const v0 = MathUtils.lerp(iesLamp.candelaValues[iHor][iVer], iesLamp.candelaValues[iHor][iVer + 1], beta);
					const v1 = MathUtils.lerp(iesLamp.candelaValues[iHor + 1][iVer], iesLamp.candelaValues[iHor + 1][iVer + 1], beta);
					intensity[j*nAzimuth+i] = MathUtils.lerp(v0, v1, alpha);
					//intensity[i*nInclination+j] = MathUtils.lerp(v0, v1, alpha);
				}
				// intensity.push(cut);
			}
			return {data:intensity, width:nAzimuth, height:nInclination};
		}
		const data = interpolateIntensity(iesLamp);
		//console.log(data.data[0]);

		let result = null;
		if ( type === UnsignedByteType ) result = Uint8Array.from( data.data.map( v => Math.min( v * 0xFF, 0xFF ) ) );
		else if ( type === HalfFloatType ) result = Uint16Array.from( data.data.map( v => DataUtils.toHalfFloat( v ) ) );
		else if ( type === FloatType ) result = Float32Array.from( data.data );
		else console.error( 'IESLoader: Unsupported type:', type );

		return {data:result, width:data.width, height:data.height};

	}

	load( url, onLoad, onProgress, onError ) {

		const loader = new FileLoader( this.manager );
		loader.setResponseType( 'text' );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setWithCredentials( this.withCredentials );
		loader.setPath( this.path );
		loader.setRequestHeader( this.requestHeader );

		loader.load( url, text => {

			onLoad( this.parse( text ) );

		}, onProgress, onError );

	}

	parse( text ) {

		const type = this.type;

		const iesLamp = new IESLamp( text );
		const data = this._getIESValues( iesLamp, type );

		const texture = new DataTexture( data.data, data.width, data.height, RedFormat, type );
		texture.minFilter = LinearFilter;
		texture.magFilter = LinearFilter;
		texture.needsUpdate = true;

		return texture;

	}

}


function IESLamp( text ) {

	const _self = this;

	const textArray = text.split( '\n' );

	let lineNumber = 0;
	let line;

	_self.verAngles = [ ];
	_self.horAngles = [ ];

	_self.candelaValues = [ ];

	_self.tiltData = { };
	_self.tiltData.angles = [ ];
	_self.tiltData.mulFactors = [ ];

	function textToArray( text ) {

		text = text.replace( /^\s+|\s+$/g, '' ); // remove leading or trailing spaces
		text = text.replace( /,/g, ' ' ); // replace commas with spaces
		text = text.replace( /\s\s+/g, ' ' ); // replace white space/tabs etc by single whitespace

		const array = text.split( ' ' );

		return array;

	}

	function readArray( count, array ) {
		while ( true ) {
			const line = textArray[ lineNumber ++ ];
			const lineData = textToArray( line );
			for ( let i = 0; i < lineData.length; ++ i ) {
				array.push( Number( lineData[ i ] ) );
			}
			if ( array.length === count )
				break;
		}
	}

	function readTilt() {

		let line = textArray[ lineNumber ++ ];
		let lineData = textToArray( line );

		_self.tiltData.lampToLumGeometry = Number( lineData[ 0 ] );

		line = textArray[ lineNumber ++ ];
		lineData = textToArray( line );

		_self.tiltData.numAngles = Number( lineData[ 0 ] );

		readArray( _self.tiltData.numAngles, _self.tiltData.angles );
		readArray( _self.tiltData.numAngles, _self.tiltData.mulFactors );

	}

	function readLampValues() {

		const values = [ ];
		readArray( 10, values );

		_self.count = Number( values[ 0 ] );
		_self.lumens = Number( values[ 1 ] );
		_self.multiplier = Number( values[ 2 ] );
		_self.numVerAngles = Number( values[ 3 ] );
		_self.numHorAngles = Number( values[ 4 ] );
		_self.gonioType = Number( values[ 5 ] );
		//console.log("gonioType "+_self.gonioType);
		_self.units = Number( values[ 6 ] );
		_self.width = Number( values[ 7 ] );
		_self.length = Number( values[ 8 ] );
		_self.height = Number( values[ 9 ] );

	}

	function readLampFactors() {

		const values = [ ];
		readArray( 3, values );

		_self.ballFactor = Number( values[ 0 ] );
		_self.blpFactor = Number( values[ 1 ] );
		_self.inputWatts = Number( values[ 2 ] );

	}

	while ( true ) {
		line = textArray[ lineNumber ++ ];
		if ( line.includes( 'TILT' ) ) {
			break;
		}
	}

	if ( ! line.includes( 'NONE' ) ) {
		if ( line.includes( 'INCLUDE' ) ) {
			readTilt();
		} else {
			// TODO:: Read tilt data from a file
		}
	}

	readLampValues();

	readLampFactors();

	// Initialize candela value array
	for ( let i = 0; i < _self.numHorAngles; ++ i ) {
		_self.candelaValues.push( [ ] );
	}

	// Parse Angles
	readArray( _self.numVerAngles, _self.verAngles );
	readArray( _self.numHorAngles, _self.horAngles );
	//console.log("verAngles "+_self.verAngles.at(-1));
	//console.log("horAngles "+_self.horAngles.at(-1));

	// Parse Candela values
	for ( let i = 0; i < _self.numHorAngles; ++ i ) {
		readArray( _self.numVerAngles, _self.candelaValues[ i ] );
	}

	// Calculate actual candela values, and normalize.
	for ( let i = 0; i < _self.numHorAngles; ++ i ) {
		for ( let j = 0; j < _self.numVerAngles; ++ j ) {
			_self.candelaValues[ i ][ j ] *= _self.multiplier * _self.ballFactor * _self.blpFactor;
		}
	}
	//console.log("cd " + _self.candelaValues[ 0 ][ 0 ]);

	//apply symmetries
	if (_self.gonioType == 1) {
		if (_self.horAngles.at(-1) == 90) {
			for (let i = _self.numHorAngles - 2; i >= 0; --i) {
				_self.candelaValues.push(_self.candelaValues[i].slice());
				_self.horAngles.push(180 - _self.horAngles[i]);
			}
			_self.numHorAngles = 2 * _self.numHorAngles - 1;
		}
		if (_self.horAngles.at(-1) == 180) {
			for (let i = _self.numHorAngles - 2; i >= 0; --i) {
				_self.candelaValues.push(_self.candelaValues[i].slice());
				_self.horAngles.push(360 - _self.horAngles[i]);
			}
			_self.numHorAngles = 2 * _self.numHorAngles - 1;
		}
		if (_self.horAngles.at(-1) != 360) {
			_self.candelaValues.push(_self.candelaValues[0].slice());
			_self.horAngles.push(360);
			_self.numHorAngles += 1;
		}
	}

	let maxVal = - 1;
	for ( let i = 0; i < _self.numHorAngles; ++ i ) {

		for ( let j = 0; j < _self.numVerAngles; ++ j ) {

			const value = _self.candelaValues[ i ][ j ];
			maxVal = maxVal < value ? value : maxVal;

		}

	}

	const bNormalize = true;
	if ( bNormalize && maxVal > 0 ) {

		for ( let i = 0; i < _self.numHorAngles; ++ i ) {

			for ( let j = 0; j < _self.numVerAngles; ++ j ) {

				_self.candelaValues[ i ][ j ] /= maxVal;

			}

		}

	}

}


export { IESLoader, IESLamp };
