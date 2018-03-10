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
        this.directory = new Date().getTime().toString();
        ReactStreetview.moveForward = ReactStreetview.moveForward.bind(this);
        ReactStreetview.difference = ReactStreetview.difference.bind(this);
        this.download = this.download.bind(this);
    }

    initialize(canvas) {
        if (this.props.googleMaps && this.streetView == null) {
            this.streetView = new this.props.googleMaps.StreetViewPanorama(
                canvas,
                this.props.streetViewPanoramaOptions
            );

            this.streetView.addListener('position_changed', () => {
                console.log("lat:" + this.streetView.location.latLng.lat());
                console.log("lng:" + this.streetView.location.latLng.lng());

                if (this.props.onPositionChanged) {
                    this.props.onPositionChanged(this.streetView, this.streetView.getPosition());
                }
            });

            this.streetView.addListener('links_changed', () => {

                this.download(this.times, this.streetView.location.latLng.lat(), this.streetView.location.latLng.lng()
                    , this.directory);

                if (this.streetView.links && this.times < this.maxTimes) {
                    console.log("times: ", this.times);
                    this.times++;
                    setTimeout(ReactStreetview.moveForward, this.speed, this.streetView);
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

    static moveForward(pano) {
        var curr;
        for (let i = 0; i < pano.links.length; i++) {
            var differ = ReactStreetview.difference(pano, pano.links[i]);
            if (curr == undefined) {
                curr = pano.links[i];
            }

            if (ReactStreetview.difference(pano, curr) > ReactStreetview.difference(pano, pano.links[i])) {
                curr = curr = pano.links[i];
            }
        }
        pano.setPano(curr.pano);
        // https://maps.googleapis.com/maps/api/streetview?size=400x300&pano=current.pano&fov=90&heading=90&pitch=0&key=AIzaSyBCNskTKxgdbmwCh4BpVH0oo5-Xqt87MvY
    }

    download(times, lat, lng, directory) {

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
                directory: directory
            })
        });

        // let download = function (uri, filename, callback) {
        //     request.head(uri, function (err, res, body) {
        //         console.log('content-type:', res.headers['content-type']);
        //         console.log('content-length:', res.headers['content-length']);
        //
        //         request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        //     });
        // };
        //
        // download('https://maps.googleapis.com/maps/api/streetview?size=400x300&location=' +
        //     lat + ',' + lng +
        //     '&fov=90&heading=90&pitch=0&key=AIzaSyBCNskTKxgdbmwCh4BpVH0oo5-Xqt87MvY',
        //     this.times + '_' + lat + '_' + lng + '.png',
        //     function () {
        //         console.log('done');
        //     });
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
        position: {lat: 46.9171876, lng: 17.8951832},
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