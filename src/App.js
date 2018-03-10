import React, {Component} from 'react';
import './App.css';
// import StreetView from 'react-google-map-street-view'
import ReactStreetview from './ReactStreetview';

class App extends Component {

    constructor() {
        super();

        this.state = {
            position: {
                lat: 35.0199835,
                lng: 135.7504525
            }
        };

        this.onPositionChanged = this.onPositionChanged.bind(this);
    }

    onPositionChanged(streetview, position) {
        console.log("streetview: " + streetview.links);
        console.log("position: " + position.lat());

        if (position.lat()) {
            this.setState({
                position : {lat: position.lat(), lng: position.lng()}
            });
        }
    }

    render() {
        // see https://developers.google.com/maps/documentation/javascript
        const googleMapsApiKey = 'AIzaSyBCNskTKxgdbmwCh4BpVH0oo5-Xqt87MvY';

        // see https://developers.google.com/maps/documentation/javascript/3.exp/reference#StreetViewPanoramaOptions
        const streetViewPanoramaOptions = {
            position: {lat: this.state.position.lat, lng: this.state.position.lng},
            pov: {heading: 100, pitch: 0},
            zoom: 1
        };

        return (
            <div style={{
                width: '800px',
                height: '450px',
                backgroundColor: '#eeeeee'
            }}>
                <ReactStreetview
                    apiKey={googleMapsApiKey}
                    streetViewPanoramaOptions={streetViewPanoramaOptions}
                    onPositionChanged={this.onPositionChanged}
                />

            </div>
        );
    }

}

export default App;