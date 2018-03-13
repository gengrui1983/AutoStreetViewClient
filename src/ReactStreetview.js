import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import asyncLoading from 'react-async-loader';
import request from 'request';

class ReactStreetview extends React.Component {

    constructor() {
        super();
        this.streetView = null;
        this.times = 0;
        this.maxTimes = 100;
        this.speed = 1000;
        this.currentHeading = null;
        this.directory = new Date().getTime().toString();
        this.creatNewDirectory = true;
        this.moveForward = this.moveForward.bind(this);
        this.initialize = this.initialize.bind(this);
        ReactStreetview.difference = ReactStreetview.difference.bind(this);
        this.download = this.download.bind(this);
    }

    initialize(canvas) {
        if (this.props.googleMaps && this.streetView == null) {
            this.streetView = new this.props.googleMaps.StreetViewPanorama(
                canvas,
                this.props.streetViewPanoramaOptions
            );

            this.currentHeading = this.props.streetViewPanoramaOptions.pov.heading;

            this.streetView.addListener('position_changed', () => {
                console.log("lat:" + this.streetView.location.latLng.lat());
                console.log("lng:" + this.streetView.location.latLng.lng());

                if (this.props.onPositionChanged) {
                    this.props.onPositionChanged(this.streetView, this.streetView.getPosition());
                }
            });

            this.streetView.addListener('links_changed', () => {

                this.download(this.times, this.streetView.location.latLng.lat(), this.streetView.location.latLng.lng(),
                    this.currentHeading, this.directory, this.creatNewDirectory);

                if (this.streetView.links && this.times < this.maxTimes) {
                    console.log("times: ", this.times);
                    this.times++;
                    setTimeout(this.moveForward, this.speed, this.streetView, this.currentHeading);
                }
            });

            this.streetView.addListener('pov_changed', () => {
                if (this.props.onPovChanged) {
                    this.props.onPovChanged(this.streetView.getPov());
                }
            });
        }
    }

    static difference(pano, link) {
        return Math.abs(pano.pov.heading % 360 - link.heading);
    }

    moveForward(pano) {
        var curr;
        for (let i = 0; i < pano.links.length; i++) {
            var differ = ReactStreetview.difference(pano, pano.links[i]);
            if (curr === undefined) {
                curr = pano.links[i];
            }

            if (ReactStreetview.difference(pano, curr) > ReactStreetview.difference(pano, pano.links[i])) {
                curr = curr = pano.links[i];
            }
        }

        let diff = Math.abs(this.currentHeading - curr.heading);
        if(diff > 45) {
            this.creatNewDirectory = true;
            this.directory = new Date().getTime();
        }
        this.currentHeading = curr.heading;

        pano.setPov({heading:curr.heading, pitch:0});
        pano.setPano(curr.pano);
    }

    download(times, lat, lng, heading, directory, createNewDirectory) {

        fetch('http://localhost:8000/geo', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                times: times,
                lat: lat,
                lng: lng,
                heading: this.currentHeading,
                directory: directory.toString(),
                createNewDirectory: createNewDirectory
            })
        });
    }

    componentDidMount() {
        this.initialize(ReactDOM.findDOMNode(this));
    }

    componentDidUpdate() {
        this.initialize(ReactDOM.findDOMNode(this));
    }

    componentWillUnmount() {
        if (this.streetView) {
            this.props.googleMaps.event.clearInstanceListeners(this.streetView);
        }
    }

    render() {
        return <div
            style={{
                height: '100%'
            }}
        />;
    }
}

ReactStreetview.propTypes = {
    apiKey: PropTypes.string.isRequired,
    streetViewPanoramaOptions: PropTypes.object.isRequired,
    onPositionChanged: PropTypes.func,
    onPovChanged: PropTypes.func
};

ReactStreetview.defaultProps = {
    streetViewPanoramaOptions: {
    // -33.877692, 151.205447
        position: {lat: -33.877692, lng: 151.205447},
        pov: {heading: 0, pitch: 0},
        zoom: 1
    }
};

function mapScriptsToProps(props) {
    const googleMapsApiKey = props.apiKey;
    return {
        googleMaps: {
            globalPath: 'google.maps',
            url: 'https://maps.googleapis.com/maps/api/js?key=' + googleMapsApiKey,
            jsonp: true
        }
    };
}

export default asyncLoading(mapScriptsToProps)(ReactStreetview);