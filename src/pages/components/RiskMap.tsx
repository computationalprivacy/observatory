import React from 'react';

import {
    ComposableMap,
    Geographies,
    Geography,
    Graticule,
} from 'react-simple-maps';
import { Country } from '../../App';

const geoUrl = './world-110m.json';

const RiskMap = (props: IProps): JSX.Element => {
    return (
        <ComposableMap style={{ marginTop: 0 }} data-tip="">
            <Graticule stroke="#EAEAEC" />
            {props.data.length > 0 && (
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const d = props.data.find(
                                (c) => c.iso3 === geo.properties.ISO_A3
                            );
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={d ? '#cc7722' : '#bcbcc3'}
                                    stroke="#EAEAEC"
                                    onMouseEnter={() => {
                                        if (d) {
                                            const { NAME } = geo.properties;
                                            props.setTooltipContent(NAME);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        props.setTooltipContent('');
                                    }}
                                    onClick={() => {
                                        if (d) {
                                            const { ISO_A3 } = geo.properties;
                                            props.countryClicked(ISO_A3);
                                        }
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            )}
            <text x="50%" y="30" textAnchor="middle" fontSize="30px">
				Available Countries
            </text>
        </ComposableMap>
    );
};

interface IProps {
    data: Country[];
    setTooltipContent: (content: string) => void;
    countryClicked: (iso3: string) => void;
}

export default RiskMap;
