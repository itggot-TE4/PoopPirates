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
            'Authorization' => 'token 245f6ddc6b6b8d043640ae7fdbf89c14854ba468'
        }
        result = HTTParty.get(params['url'], :headers => headers)
        p result
        return result.to_json
    end
end