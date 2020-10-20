class Application < Sinatra::Base

    before do
        headers 'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST']
    end

    get '/?' do
        slim :index
    end

    get '/api/send/request/?' do
        headers = {
            'Authorization' => 'token a6aced0802246927eaa3de49aedfa13cd30e26ec'
        }
        result = HTTParty.get(params['url'], :headers => headers)
        p result
        return result.to_json
    end
end